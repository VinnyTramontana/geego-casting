import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendMonthlyReportEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const headerSecret = request.headers.get("x-cron-secret");

    if (!cronSecret || headerSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Compute prior month in America/New_York
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    const priorMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthKey = `${priorMonth.getFullYear()}-${String(priorMonth.getMonth() + 1).padStart(2, "0")}`;

    // Idempotency check
    const existing = await prisma.monthlyReport.findUnique({ where: { monthKey } });
    if (existing) {
      return NextResponse.json({ message: "Report already sent", monthKey });
    }

    const startDate = new Date(priorMonth.getFullYear(), priorMonth.getMonth(), 1);
    const endDate = new Date(priorMonth.getFullYear(), priorMonth.getMonth() + 1, 1);

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
          gramsByMetal[q.selectedMetal] = (gramsByMetal[q.selectedMetal] || 0) + p.effectiveMassG * p.quantity;
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

    const reportData = {
      monthKey,
      orderCount: orders.length,
      totalRevenue: paidRevenue,
      orders: orders.map(o => ({
        id: o.id,
        createdAt: o.createdAt.toISOString().split("T")[0],
        selectedMetal: o.selectedMetal,
        totalUsd: o.totalUsd,
        paymentStatus: o.paymentStatus,
        customerEmail: o.customerEmail,
      })),
      totalModels,
      totalQuantity,
      gramsByMetal,
      materialTotal: Math.round(materialTotal * 100) / 100,
      finalTotal: Math.round(finalTotalSum * 100) / 100,
      paidRevenue: Math.round(paidRevenue * 100) / 100,
      pendingRevenue: Math.round(pendingRevenue * 100) / 100,
      demoModeCount,
    };

    await sendMonthlyReportEmail(reportData);

    await prisma.monthlyReport.create({
      data: {
        monthKey,
        totals: JSON.stringify(reportData),
      },
    });

    return NextResponse.json({ success: true, monthKey });
  } catch (err) {
    console.error("Monthly report error:", err);
    return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
  }
}
