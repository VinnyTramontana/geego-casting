import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { checkRateLimit } from "@/lib/rate-limit";
import { calculateQuote } from "@/lib/pricing";
import { findMetal } from "@/lib/metals";
import { CreateSessionSchema } from "@/lib/validation";
import { storeFile } from "@/lib/storage";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEMO_PRICES: Record<string, number> = { XAU: 2350.0, XAG: 28.5, XPT: 1020.0 };

async function getSpotPrices(): Promise<{ prices: Record<string, number>; demoMode: boolean }> {
  const apiKey = process.env.METALPRICE_API_KEY;
  if (!apiKey) return { prices: DEMO_PRICES, demoMode: true };
  try {
    const res = await fetch(`https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=XAU,XAG,XPT`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    const rates = data.rates;
    return { prices: { XAU: Math.round(100 / rates.USDXAU) / 100, XAG: Math.round(100 / rates.USDXAG) / 100, XPT: Math.round(100 / rates.USDXPT) / 100 }, demoMode: false };
  } catch {
    return { prices: DEMO_PRICES, demoMode: true };
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = checkRateLimit(`payment:${ip}`, { maxRequests: 10, windowMs: 60_000 });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const body = await request.json();
    const parsed = CreateSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const { files, metalLabel, unit, settings, productionNotes, fileData } = parsed.data;
    const metal = findMetal(metalLabel);
    if (!metal) {
      return NextResponse.json({ error: "Unknown metal" }, { status: 400 });
    }

    // Server-side recompute
    const { prices, demoMode } = await getSpotPrices();
    const spotPricePerOz = prices[metal.spotSymbol];
    const result = calculateQuote({ parts: files, metal, spotPricePerOz, unit, settings });
    const finalTotal = result.totals.finalTotal;

    if (finalTotal <= 0) {
      return NextResponse.json({ error: "Invalid total" }, { status: 400 });
    }

    // Store files
    const storedFiles = await Promise.all(
      fileData.map(async (fd) => {
        const buffer = Buffer.from(fd.base64, "base64");
        const stored = await storeFile(buffer, fd.fileName);
        return { fileName: fd.fileName, ...stored };
      })
    );

    // Create order
    const totalQuantity = files.reduce((s, f) => s + f.quantity, 0);
    const order = await prisma.order.create({
      data: {
        selectedMetal: metalLabel,
        unit,
        productionNotes: productionNotes || "",
        totalUsd: finalTotal,
        paymentStatus: "PENDING",
        fileMetadata: JSON.stringify(storedFiles),
        quoteData: JSON.stringify({ ...result, demoMode, spotPrices: prices }),
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `Geego Casting - ${metalLabel} - ${totalQuantity} item(s)`,
            description: `Casting order: ${files.length} model(s), ${totalQuantity} total pieces`,
          },
          unit_amount: Math.round(finalTotal * 100),
        },
        quantity: 1,
      }],
      metadata: { orderId: order.id },
      shipping_address_collection: { allowed_countries: ["US"] },
      success_url: `${baseUrl}/success?order_id=${order.id}`,
      cancel_url: `${baseUrl}/?canceled=true`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error("Payment session error:", err);
    return NextResponse.json({ error: "Failed to create payment session" }, { status: 500 });
  }
}
