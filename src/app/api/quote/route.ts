import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { calculateQuote, volumeToUnitCm3 } from "@/lib/pricing";
import { findMetal } from "@/lib/metals";
import { QuoteRequestSchema } from "@/lib/validation";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Reuse the price cache from /api/prices
const DEMO_PRICES: Record<string, number> = { XAU: 2350.0, XAG: 28.5, XPT: 1020.0 };

let cachedPrices: { prices: Record<string, number>; demoMode: boolean; at: number } | null = null;

async function getSpotPrices(): Promise<{ prices: Record<string, number>; demoMode: boolean }> {
  if (cachedPrices && Date.now() - cachedPrices.at < 60_000) {
    return { prices: cachedPrices.prices, demoMode: cachedPrices.demoMode };
  }
  const apiKey = process.env.METALPRICE_API_KEY;
  if (!apiKey) {
    cachedPrices = { prices: DEMO_PRICES, demoMode: true, at: Date.now() };
    return { prices: DEMO_PRICES, demoMode: true };
  }
  try {
    const res = await fetch(`https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=XAU,XAG,XPT`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    const rates = data.rates;
    const prices = { XAU: Math.round(100 / rates.USDXAU) / 100, XAG: Math.round(100 / rates.USDXAG) / 100, XPT: Math.round(100 / rates.USDXPT) / 100 };
    cachedPrices = { prices, demoMode: false, at: Date.now() };
    return { prices, demoMode: false };
  } catch {
    cachedPrices = { prices: DEMO_PRICES, demoMode: true, at: Date.now() };
    return { prices: DEMO_PRICES, demoMode: true };
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = checkRateLimit(`quote:${ip}`);
    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = QuoteRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const { files, metalLabel, unit, settings } = parsed.data;
    const metal = findMetal(metalLabel);
    if (!metal) {
      return NextResponse.json({ error: "Unknown metal option" }, { status: 400 });
    }

    const { prices, demoMode } = await getSpotPrices();
    const spotPricePerOz = prices[metal.spotSymbol];

    const parts = files.map(f => ({
      fileName: f.fileName,
      volumeCm3: f.volumeCm3,
      quantity: f.quantity,
      warnings: f.warnings,
    }));

    const result = calculateQuote({ parts, metal, spotPricePerOz, unit, settings });

    // Save QuoteEvent
    const totalQuantity = files.reduce((s, f) => s + f.quantity, 0);
    await prisma.quoteEvent.create({
      data: {
        fileCount: files.length,
        totalQuantity,
        selectedMetal: metalLabel,
        unit,
        demoMode,
        spotPricesUsed: JSON.stringify(prices),
        settings: JSON.stringify(settings),
        perPart: JSON.stringify(result.perPart),
        totals: JSON.stringify(result.totals),
      },
    });

    return NextResponse.json({ ...result, demoMode, spotPrices: prices });
  } catch (err) {
    console.error("Quote error:", err);
    return NextResponse.json({ error: "Failed to compute quote" }, { status: 500 });
  }
}
