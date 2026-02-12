import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { sendCastingTeamEmail, sendCustomerConfirmationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");

    if (!sig) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (!orderId) {
        console.error("No orderId in session metadata");
        return NextResponse.json({ received: true });
      }

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        console.error("Order not found:", orderId);
        return NextResponse.json({ received: true });
      }

      // Extract shipping and customer info from Stripe session
      const shipping = session.shipping_details;
      const customerEmail = session.customer_details?.email || "";

      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          customerEmail,
          shippingName: shipping?.name || "",
          shippingAddress1: shipping?.address?.line1 || "",
          shippingAddress2: shipping?.address?.line2 || "",
          shippingCity: shipping?.address?.city || "",
          shippingState: shipping?.address?.state || "",
          shippingZip: shipping?.address?.postal_code || "",
          shippingCountry: shipping?.address?.country || "US",
        },
      });

      // Send emails idempotently
      const updatedOrder = await prisma.order.findUnique({ where: { id: orderId } });
      if (updatedOrder && !updatedOrder.castingEmailSentAt) {
        try {
          await sendCastingTeamEmail(updatedOrder);
          await sendCustomerConfirmationEmail(updatedOrder);
          await prisma.order.update({
            where: { id: orderId },
            data: { castingEmailSentAt: new Date() },
          });
        } catch (emailErr) {
          console.error("Failed to send order emails:", emailErr);
        }
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "CANCELED" },
        }).catch(() => {});
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
