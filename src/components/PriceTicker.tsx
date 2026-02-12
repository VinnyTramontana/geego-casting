"use client";

import { useEffect, useState, useCallback } from "react";

const TROY_OZ_GRAMS = 31.1034768;

interface PriceData {
  prices: { XAU: number; XAG: number; XPT: number };
  demoMode: boolean;
  cachedAt: string;
}

export default function PriceTicker() {
  const [data, setData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/prices");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Silently fail - ticker is not critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60_000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  function fmtOz(val: number): string {
    return `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  function fmtG(val: number): string {
    const perG = val / TROY_OZ_GRAMS;
    return `$${perG.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <div className="border-b border-[#1a1a2e] bg-[#0a0a14]">
      {data?.demoMode && (
        <div className="bg-amber-900/50 text-center text-xs text-amber-300 py-1">
          Demo Mode — Prices shown are for demonstration only
        </div>
      )}
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-4 px-4 py-1.5 text-xs sm:gap-8 flex-wrap">
        {loading ? (
          <div className="text-gray-500 animate-pulse">Loading spot prices...</div>
        ) : data ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#C9A84C]">Gold</span>
              <span className="text-gray-400">{fmtOz(data.prices.XAU)}/oz</span>
              <span className="text-gray-500">({fmtG(data.prices.XAU)}/g)</span>
            </div>
            <div className="h-3 w-px bg-[#2a2a40]" />
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-300">Silver</span>
              <span className="text-gray-400">{fmtOz(data.prices.XAG)}/oz</span>
              <span className="text-gray-500">({fmtG(data.prices.XAG)}/g)</span>
            </div>
            <div className="h-3 w-px bg-[#2a2a40]" />
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-300">Platinum</span>
              <span className="text-gray-400">{fmtOz(data.prices.XPT)}/oz</span>
              <span className="text-gray-500">({fmtG(data.prices.XPT)}/g)</span>
            </div>
          </>
        ) : (
          <span className="text-gray-500">Prices unavailable</span>
        )}
      </div>
    </div>
  );
}
