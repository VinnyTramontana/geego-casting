import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: order.id,
      createdAt: order.createdAt,
      selectedMetal: order.selectedMetal,
      totalUsd: order.totalUsd,
      paymentStatus: order.paymentStatus,
      shippingCity: order.shippingCity,
      shippingState: order.shippingState,
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
