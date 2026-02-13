"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

interface OrderInfo {
  id: string;
  createdAt: string;
  selectedMetal: string;
  totalUsd: number;
  paymentStatus: string;
  shippingCity: string | null;
  shippingState: string | null;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    fetch(`/api/order/${encodeURIComponent(orderId)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setOrder(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" />
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">No order ID provided.</p>
        <Link href="/" className="mt-4 inline-block text-[#C9A84C] hover:underline">
          Return to Calculator
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Could not load order details.</p>
        <Link href="/" className="mt-4 inline-block text-[#C9A84C] hover:underline">
          Return to Calculator
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8 text-center">
      {/* Checkmark */}
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-900/30 border border-green-700/50">
        <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] bg-clip-text text-transparent mb-3">
        Order Confirmed
      </h1>
      <p className="text-gray-400 mb-8">
        Thank you for your order! We&rsquo;ve received your payment and will begin casting shortly.
      </p>

      {order && (
        <div className="rounded-xl border border-[#2a2a40] bg-[#1a1a2e] p-6 text-left space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Order ID</span>
            <span className="text-white font-mono text-sm">{order.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Metal</span>
            <span className="text-white">{order.selectedMetal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total</span>
            <span className="text-[#C9A84C] font-semibold">${order.totalUsd.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Status</span>
            <span className="text-green-400 font-medium">{order.paymentStatus}</span>
          </div>
          {order.shippingCity && (
            <div className="flex justify-between">
              <span className="text-gray-400">Shipping to</span>
              <span className="text-white">{order.shippingCity}, {order.shippingState}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={`/order/${orderId}`}
          className="rounded-lg border border-[#C9A84C] px-6 py-2.5 text-sm font-medium text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors"
        >
          Track Order
        </Link>
        <Link
          href="/"
          className="rounded-lg bg-[#1a1a2e] border border-[#2a2a40] px-6 py-2.5 text-sm font-medium text-gray-300 hover:bg-[#2a2a40] transition-colors"
        >
          New Quote
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
