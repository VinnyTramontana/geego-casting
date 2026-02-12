import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// ── Module-level cache ──────────────────────────────────────────
interface PriceCache {
  prices: Record<string, number>;
  demoMode: boolean;
  cachedAt: string;
  expiresAt: number;
}

let priceCache: PriceCache | null = null;
const CACHE_TTL_MS = 60_000; // 60 seconds

// ── Demo fallback prices ────────────────────────────────────────
const DEMO_PRICES: Record<string, number> = {
  XAU: 2350.0,
  XAG: 28.5,
  XPT: 1020.0,
};

export async function GET(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const limit = checkRateLimit(`prices:${ip}`);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests", retryAfterMs: limit.retryAfterMs },
        { status: 429 }
      );
    }

    // Return cached data if still valid
    if (priceCache && Date.now() < priceCache.expiresAt) {
      return NextResponse.json({
        prices: priceCache.prices,
        demoMode: priceCache.demoMode,
        cachedAt: priceCache.cachedAt,
      });
    }

    const apiKey = process.env.METALPRICE_API_KEY;

    // If no API key, return demo prices
    if (!apiKey) {
      const now = new Date().toISOString();
      priceCache = {
        prices: { ...DEMO_PRICES },
        demoMode: true,
        cachedAt: now,
        expiresAt: Date.now() + CACHE_TTL_MS,
      };

      return NextResponse.json({
        prices: priceCache.prices,
        demoMode: true,
        cachedAt: now,
      });
    }

    // Fetch live prices from MetalPriceAPI
    try {
      const url = `https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=XAU,XAG,XPT`;
      const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });

      if (!response.ok) {
        throw new Error(`MetalPriceAPI returned ${response.status}`);
      }

      const data = await response.json();

      // The API returns {"rates": {"USDXAU": 0.000425, "USDXAG": 0.035, "USDXPT": 0.00098, ...}}
      // Spot price per oz = 1 / rate
      const rates = data.rates;
      if (!rates || !rates.USDXAU || !rates.USDXAG || !rates.USDXPT) {
        throw new Error("Unexpected API response format");
      }

      const prices: Record<string, number> = {
        XAU: roundTo(1 / rates.USDXAU, 2),
        XAG: roundTo(1 / rates.USDXAG, 2),
        XPT: roundTo(1 / rates.USDXPT, 2),
      };

      const now = new Date().toISOString();
      priceCache = {
        prices,
        demoMode: false,
        cachedAt: now,
        expiresAt: Date.now() + CACHE_TTL_MS,
      };

      return NextResponse.json({
        prices,
        demoMode: false,
        cachedAt: now,
      });
    } catch {
      // API call failed - fall back to demo prices
      const now = new Date().toISOString();
      priceCache = {
        prices: { ...DEMO_PRICES },
        demoMode: true,
        cachedAt: now,
        expiresAt: Date.now() + CACHE_TTL_MS,
      };

      return NextResponse.json({
        prices: priceCache.prices,
        demoMode: true,
        cachedAt: now,
      });
    }
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
