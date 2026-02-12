import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { MetricsQuerySchema } from "@/lib/validation";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const month = request.nextUrl.searchParams.get("month") || "";
  const parsed = MetricsQuerySchema.safeParse({ month });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid month format (YYYY-MM)" }, { status: 400 });
  }

  try {
    const [year, mon] = parsed.data.month.split("-").map(Number);
    const startDate = new Date(year, mon - 1, 1);
    const endDate = new Date(year, mon, 1);

    const quotes = await prisma.quoteEvent.findMany({
      where: { createdAt: { gte: startDate, lt: endDate } },
    });

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startDate, lt: endDate } },
    });

    let totalModels = 0;
    let totalQuantity = 0;
    const gramsByMetal: Record<string, number> = {};
    let materialTotal = 0;
    let finalTotalSum = 0;
    let demoModeCount = 0;

    for (const q of quotes) {
      totalModels += q.fileCount;
      totalQuantity += q.totalQuantity;
      if (q.demoMode) demoModeCount++;

      try {
        const perPart = JSON.parse(q.perPart) as Array<{ effectiveMassG: number; quantity: number }>;
        for (const p of perPart) {
          const metal = q.selectedMetal;
          gramsByMetal[metal] = (gramsByMetal[metal] || 0) + p.effectiveMassG * p.quantity;
        }
      } catch {}

      try {
        const totals = JSON.parse(q.totals) as { materialSubtotal: number; finalTotal: number };
        materialTotal += totals.materialSubtotal || 0;
        finalTotalSum += totals.finalTotal || 0;
      } catch {}
    }

    let paidRevenue = 0;
    let pendingRevenue = 0;
    for (const o of orders) {
      if (o.paymentStatus === "PAID") paidRevenue += o.totalUsd;
      else if (o.paymentStatus === "PENDING") pendingRevenue += o.totalUsd;
    }

    return NextResponse.json({
      month: parsed.data.month,
      totalModels,
      totalQuantity,
      gramsByMetal,
      materialTotal: Math.round(materialTotal * 100) / 100,
      finalTotal: Math.round(finalTotalSum * 100) / 100,
      paidRevenue: Math.round(paidRevenue * 100) / 100,
      pendingRevenue: Math.round(pendingRevenue * 100) / 100,
      orderCount: orders.length,
      quoteCount: quotes.length,
      demoModeCount,
    });
  } catch (err) {
    console.error("Metrics error:", err);
    return NextResponse.json({ error: "Failed to compute metrics" }, { status: 500 });
  }
}
