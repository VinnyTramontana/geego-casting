"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Metrics {
  month: string;
  totalModels: number;
  totalQuantity: number;
  gramsByMetal: Record<string, number>;
  materialTotal: number;
  finalTotal: number;
  paidRevenue: number;
  pendingRevenue: number;
  orderCount: number;
  quoteCount: number;
  demoModeCount: number;
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function AdminMetricsPage() {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/admin/metrics?month=${month}`)
      .then((res) => {
        if (res.status === 401) {
          router.push("/admin");
          return null;
        }
        if (!res.ok) throw new Error("Failed to load metrics");
        return res.json();
      })
      .then((data) => {
        if (data) setMetrics(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [month, router]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] bg-clip-text text-transparent">
          Monthly Metrics
        </h1>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="text-sm"
          />
          <Link
            href={`/admin/export?month=${month}`}
            className="rounded-lg border border-[#C9A84C] px-4 py-2 text-xs font-medium text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors"
          >
            Export CSV
          </Link>
        </div>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" />
        </div>
      ) : metrics ? (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Quotes" value={metrics.quoteCount} />
            <StatCard label="Orders" value={metrics.orderCount} />
            <StatCard label="Paid Revenue" value={`$${metrics.paidRevenue.toFixed(2)}`} highlight />
            <StatCard label="Pending Revenue" value={`$${metrics.pendingRevenue.toFixed(2)}`} />
            <StatCard label="Models Quoted" value={metrics.totalModels} />
            <StatCard label="Total Qty" value={metrics.totalQuantity} />
            <StatCard label="Material Total" value={`$${metrics.materialTotal.toFixed(2)}`} />
            <StatCard label="Final Total" value={`$${metrics.finalTotal.toFixed(2)}`} />
          </div>

          {/* Grams by metal */}
          <div className="rounded-xl border border-[#2a2a40] bg-[#1a1a2e] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Grams by Metal</h2>
            {Object.keys(metrics.gramsByMetal).length === 0 ? (
              <p className="text-gray-500 text-sm">No data for this month.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(metrics.gramsByMetal)
                  .sort(([, a], [, b]) => b - a)
                  .map(([metal, grams]) => (
                    <div key={metal} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{metal}</span>
                      <span className="text-sm font-mono text-white">{grams.toFixed(2)} g</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Demo mode warning */}
          {metrics.demoModeCount > 0 && (
            <p className="mt-4 text-xs text-yellow-500">
              {metrics.demoModeCount} of {metrics.quoteCount} quotes used demo prices (no live API key).
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-[#2a2a40] bg-[#1a1a2e] p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold mt-1 ${highlight ? "text-[#C9A84C]" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
