"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-green-900/30 text-green-400 border-green-700/50",
  PENDING: "bg-yellow-900/30 text-yellow-400 border-yellow-700/50",
  CANCELED: "bg-red-900/30 text-red-400 border-red-700/50",
};

export default function OrderStatusPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/order/${encodeURIComponent(id)}`)
      .then((res) => {
        if (res.status === 404) throw new Error("Order not found");
        if (!res.ok) throw new Error("Failed to load order");
        return res.json();
      })
      .then((data) => setOrder(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-3">Order Not Found</h1>
        <p className="text-gray-400 mb-6">{error}</p>
        <Link href="/" className="text-[#C9A84C] hover:underline">
          Return to Calculator
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const statusStyle = STATUS_STYLES[order.paymentStatus] || STATUS_STYLES.PENDING;
  const createdDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] bg-clip-text text-transparent mb-8">
        Order Status
      </h1>

      <div className="rounded-xl border border-[#2a2a40] bg-[#1a1a2e] p-6 sm:p-8 space-y-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Order ID</p>
            <p className="text-white font-mono text-sm mt-1 break-all">{order.id}</p>
          </div>
          <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle}`}>
            {order.paymentStatus}
          </span>
        </div>

        <hr className="border-[#2a2a40]" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Metal</p>
            <p className="text-white mt-1">{order.selectedMetal}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
            <p className="text-[#C9A84C] font-semibold mt-1">${order.totalUsd.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Date</p>
            <p className="text-white mt-1">{createdDate}</p>
          </div>
          {order.shippingCity && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Shipping To</p>
              <p className="text-white mt-1">{order.shippingCity}, {order.shippingState}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 mb-4">
          Questions about your order? Email{" "}
          <a href="mailto:geegoco@gmail.com" className="text-[#C9A84C] hover:underline">
            geegoco@gmail.com
          </a>
        </p>
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          &larr; Back to Calculator
        </Link>
      </div>
    </div>
  );
}
