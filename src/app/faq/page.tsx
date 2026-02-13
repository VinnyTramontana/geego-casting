export const metadata = {
  title: "FAQ | Geego Casting",
  description: "Frequently asked questions about precious metal casting services at Geego Casting.",
};

const faqs = [
  {
    q: "What file format do you accept?",
    a: "We accept STL files (both ASCII and binary). Your 3D model should be a closed (watertight) solid for accurate volume calculation.",
  },
  {
    q: "What metals do you offer?",
    a: "We cast in 18K Gold (Yellow, White, Pink), 14K Gold (Yellow, White, Pink), 950 Platinum, and 985 Silver.",
  },
  {
    q: "How are prices calculated?",
    a: "We calculate the volume of your STL model, multiply by the metal density to get mass, then price based on live spot prices plus a 10% fabrication markup. Additional fees may include print fees, shipping, and rush charges.",
  },
  {
    q: "Are the prices on the site final?",
    a: "Quotes are estimates based on live spot metal prices at the time of checkout. Metal prices fluctuate, so the final charge is locked in when you complete payment through Stripe.",
  },
  {
    q: "What is the minimum order?",
    a: "There is a $75 minimum charge per order to cover baseline casting costs. If your metal cost is below this, the minimum charge applies.",
  },
  {
    q: "Do you ship internationally?",
    a: "Currently we ship within the United States only. A flat $25 shipping fee is included in every order.",
  },
  {
    q: "How long does casting take?",
    a: "Standard turnaround is approximately 2\u20133 weeks from payment. Rush orders (15% surcharge) are prioritized and typically ship within 1 week.",
  },
  {
    q: "Can I upload multiple parts?",
    a: "Yes. You can upload up to 10 STL files per quote. Each part can have its own quantity, and all parts share the same metal selection.",
  },
  {
    q: "What if my model isn\u2019t watertight?",
    a: "Our parser will flag non-watertight models with a warning. The volume estimate may be less accurate for open meshes. We recommend repairing your model in software like Meshmixer before uploading.",
  },
  {
    q: "How do I check my order status?",
    a: "After payment you\u2019ll receive a confirmation email with a tracking link. You can also visit the order status page using your order ID.",
  },
];

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] bg-clip-text text-transparent mb-8">
        Frequently Asked Questions
      </h1>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#2a2a40] bg-[#1a1a2e] p-5 sm:p-6"
          >
            <h2 className="text-base font-semibold text-white mb-2">
              {faq.q}
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
