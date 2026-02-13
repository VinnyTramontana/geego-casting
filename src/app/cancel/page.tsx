import Link from "next/link";

export const metadata = {
  title: "Order Cancelled | Geego Casting",
};

export default function CancelPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8 text-center">
      {/* X icon */}
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-900/30 border border-red-700/50">
        <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-white mb-3">
        Payment Cancelled
      </h1>
      <p className="text-gray-400 mb-8">
        Your payment was not completed. No charge has been made. Your quote is
        still available if you&rsquo;d like to try again.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8963F] px-6 py-2.5 text-sm font-semibold text-[#0f0f1a] hover:from-[#D4B85A] hover:to-[#C9A84C] transition-colors"
        >
          Return to Calculator
        </Link>
        <Link
          href="/contact"
          className="rounded-lg bg-[#1a1a2e] border border-[#2a2a40] px-6 py-2.5 text-sm font-medium text-gray-300 hover:bg-[#2a2a40] transition-colors"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
