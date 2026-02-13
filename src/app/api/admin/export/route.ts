import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";
import { ExportQuerySchema } from "@/lib/validation";
import prisma from "@/lib/prisma";

interface OrderRow {
  id: string;
  createdAt: Date;
  customerEmail: string;
  selectedMetal: string;
  totalUsd: number;
  paymentStatus: string;
  quoteData: string;
}

interface QuotePartEntry {
  quantity?: number;
  effectiveMassG?: number;
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const month = request.nextUrl.searchParams.get("month") || "";
  const parsed = ExportQuerySchema.safeParse({ month });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid month format" }, { status: 400 });
  }

  try {
    const [year, mon] = parsed.data.month.split("-").map(Number);
    const startDate = new Date(year, mon - 1, 1);
    const endDate = new Date(year, mon, 1);

    const orders: OrderRow[] = await prisma.order.findMany();
      where: { createdAt: { gte: startDate, lt: endDate } },
      orderBy: { createdAt: "asc" },
    })) as OrderRow[];

    const headers = ["Order ID", "Date", "Customer Email", "Metal", "Total Qty", "Total Grams", "Total USD", "Payment Status"];
    const rows = orders.map((o: OrderRow) => {
      let totalQty = 0;
      let totalGrams = 0;
      try {
        const qd = JSON.parse(o.quoteData) as { perPart?: QuotePartEntry[] };
        if (qd.perPart) {
          for (const p of qd.perPart) {
            totalQty += p.quantity || 0;
            totalGrams += (p.effectiveMassG || 0) * (p.quantity || 0);
          }
        }
      } catch {}
      return [
        o.id,
        o.createdAt.toISOString().split("T")[0],
        o.customerEmail,
        o.selectedMetal,
        totalQty.toString(),
        totalGrams.toFixed(2),
        o.totalUsd.toFixed(2),
        o.paymentStatus,
      ].map(v => `"${v.replace(/"/g, '""')}"`).join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="geego-orders-${parsed.data.month}.csv"`,
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
