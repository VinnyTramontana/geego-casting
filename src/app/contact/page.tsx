export const metadata = {
  title: "Contact Us | Geego Casting",
  description: "Get in touch with Geego Casting for questions about precious metal jewelry casting.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] bg-clip-text text-transparent mb-8">
        Contact Us
      </h1>

      <div className="rounded-xl border border-[#2a2a40] bg-[#1a1a2e] p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">Email</h2>
          <a
            href="mailto:geegoco@gmail.com"
            className="text-[#C9A84C] hover:underline"
          >
            geegoco@gmail.com
          </a>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">
            How It Works
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Upload your STL file(s) using our online calculator.</li>
            <li>Select your metal, quantity, and options.</li>
            <li>Review the instant quote and proceed to checkout.</li>
            <li>
              We receive your order, cast your piece, and ship it to you.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">
            Response Time
          </h2>
          <p className="text-gray-300">
            We typically respond within 1&ndash;2 business days. For urgent
            requests, please mention &ldquo;URGENT&rdquo; in your subject line.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">
            Custom Orders
          </h2>
          <p className="text-gray-300">
            Have a special project or need a metal not listed? Email us with
            details and we&rsquo;ll provide a custom quote.
          </p>
        </div>
      </div>
    </div>
  );
}
