"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

function ExportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const month = searchParams.get("month") || "";
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!month) {
      setStatus("error");
      setErrorMsg("No month specified. Go to metrics and click Export CSV.");
      return;
    }

    fetch(`/api/admin/export?month=${month}`)
      .then((res) => {
        if (res.status === 401) {
          router.push("/admin");
          return null;
        }
        if (!res.ok) throw new Error("Export failed");
        return res.blob();
      })
      .then((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `geego-orders-${month}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setStatus("done");
      })
      .catch((err) => {
        setErrorMsg(err.message);
        setStatus("error");
      });
  }, [month, router]);

  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-6 text-center">
      {status === "loading" && (
        <>
          <div className="mx-auto mb-6 h-8 w-8 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" />
          <p className="text-gray-400">Generating CSV export for {month}...</p>
        </>
      )}

      {status === "done" && (
        <>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-900/30 border border-green-700/50">
            <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Export Complete</h1>
          <p className="text-gray-400 text-sm mb-6">
            Your CSV file for {month} has been downloaded.
          </p>
          <Link
            href="/admin/metrics"
            className="text-[#C9A84C] hover:underline text-sm"
          >
            &larr; Back to Metrics
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="text-xl font-bold text-white mb-2">Export Failed</h1>
          <p className="text-red-400 text-sm mb-6">{errorMsg}</p>
          <Link
            href="/admin/metrics"
            className="text-[#C9A84C] hover:underline text-sm"
          >
            &larr; Back to Metrics
          </Link>
        </>
      )}
    </div>
  );
}

export default function AdminExportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" />
        </div>
      }
    >
      <ExportContent />
    </Suspense>
  );
}
