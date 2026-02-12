"use client";

import type { PricingResult } from "@/types";

interface QuoteResultsProps {
  result: PricingResult | null;
  demoMode: boolean;
  metalLabel: string;
  unit: string;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function QuoteResults({ result, demoMode, metalLabel, unit }: QuoteResultsProps) {
  if (!result) return null;

  const { perPart, totals } = result;

  return (
    <section className="bg-[#1a1a2e] border border-[#2a2a40] rounded-2xl p-6 space-y-6">
      <h2 className="text-xl font-semibold text-white">Quote Breakdown</h2>

      {/* ── Per-Part Table ── */}
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a40] text-gray-400 text-xs uppercase tracking-wider">
              <th className="text-left py-3 pr-3">File</th>
              <th className="text-center py-3 px-2">Qty</th>
              <th className="text-right py-3 px-2">Volume (cm&sup3;)</th>
              <th className="text-right py-3 px-2 hidden sm:table-cell">Eff.&nbsp;Mass (g)</th>
              <th className="text-right py-3 px-2 hidden md:table-cell">$/g</th>
              <th className="text-right py-3 px-2 hidden md:table-cell">Part Cost</th>
              <th className="text-right py-3 pl-2">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {perPart.map((p, i) => (
              <tr key={i} className="border-b border-[#2a2a40]/50 text-gray-300">
                <td className="py-2.5 pr-3">
                  <span className="text-white font-medium">{p.fileName}</span>
                  {p.warnings.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {p.warnings.map((w, wi) => (
                        <p key={wi} className="text-xs text-amber-400 flex items-center gap-1">
                          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          {w}
                        </p>
                      ))}
                    </div>
                  )}
                </td>
                <td className="text-center py-2.5 px-2">{p.quantity}</td>
                <td className="text-right py-2.5 px-2">{fmt(p.volumeCm3)}</td>
                <td className="text-right py-2.5 px-2 hidden sm:table-cell">{fmt(p.effectiveMassG)}</td>
                <td className="text-right py-2.5 px-2 hidden md:table-cell">${fmt(p.adjustedPricePerG)}</td>
                <td className="text-right py-2.5 px-2 hidden md:table-cell">${fmt(p.partCostUsd)}</td>
                <td className="text-right py-2.5 pl-2 text-white font-medium">${fmt(p.lineTotalUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Totals Breakdown ── */}
      <div className="bg-[#12121f] border border-[#2a2a40] rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
          Totals
        </h3>
        <div className="space-y-2 text-sm">
          <Row label="Material Subtotal" value={`$${fmt(totals.materialSubtotal)}`} />

          {totals.minApplied && (
            <Row
              label={`Minimum Charge Applied (+$${fmt(totals.minDelta)})`}
              value={`$${fmt(totals.materialAfterMin)}`}
              accent="amber"
            />
          )}

          {totals.printFeeTotal > 0 && (
            <Row label="3D Print Fee" value={`$${fmt(totals.printFeeTotal)}`} />
          )}

          {totals.shippingFeeTotal > 0 && (
            <Row label="Shipping Fee" value={`$${fmt(totals.shippingFeeTotal)}`} />
          )}

          {totals.castingFeeFlat > 0 && (
            <Row label="Casting Fee" value={`$${fmt(totals.castingFeeFlat)}`} />
          )}

          {totals.finishingFeeFlat > 0 && (
            <Row label="Finishing Fee" value={`$${fmt(totals.finishingFeeFlat)}`} />
          )}

          <div className="border-t border-[#2a2a40] my-2" />
          <Row label="Subtotal" value={`$${fmt(totals.subtotalBeforePercent)}`} />

          {totals.optionalPercentFeeAmount > 0 && (
            <Row label="Optional % Fee" value={`$${fmt(totals.optionalPercentFeeAmount)}`} />
          )}

          {totals.rushFeeAmount > 0 && (
            <Row label="Rush Fee" value={`$${fmt(totals.rushFeeAmount)}`} accent="red" bold />
          )}

          <div className="border-t-2 border-[#C9A84C]/30 my-3" />
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-white">Final Total</span>
            <span className="text-2xl font-bold text-[#C9A84C]">${fmt(totals.finalTotal)}</span>
          </div>
        </div>
      </div>

      {/* ── Meta Info ── */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>
          {metalLabel} &middot; Spot: ${fmt(result.spotPricePerOz)}/oz (${fmt(result.spotPricePerG)}/g)
          &middot; Adjusted: ${fmt(result.adjustedPricePerG)}/g &middot; Density: {result.density} g/cm&sup3;
          &middot; Unit: {unit}
        </p>
        {demoMode && (
          <p className="text-amber-500">
            Demo mode — prices are for demonstration only and may not reflect current market rates.
          </p>
        )}
        <p className="text-gray-600 italic">
          This is an estimate only. Final pricing may vary based on actual casting conditions and metal market fluctuations.
        </p>
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  accent,
  bold,
}: {
  label: string;
  value: string;
  accent?: "amber" | "red";
  bold?: boolean;
}) {
  const labelColor =
    accent === "amber" ? "text-amber-400" :
    accent === "red" ? "text-red-400 font-semibold" :
    "text-gray-400";
  const valueColor =
    accent === "amber" ? "text-amber-400" :
    accent === "red" ? "text-red-400 font-semibold" :
    "text-white";

  return (
    <div className={`flex items-center justify-between ${bold ? "font-semibold" : ""}`}>
      <span className={labelColor}>{label}</span>
      <span className={valueColor}>{value}</span>
    </div>
  );
}
