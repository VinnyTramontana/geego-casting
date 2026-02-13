export const metadata = {
  title: "Privacy Policy | Geego Casting",
  description: "Privacy policy for Geego Casting precious metal casting services.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] bg-clip-text text-transparent mb-8">
        Privacy Policy
      </h1>

      <div className="rounded-xl border border-[#2a2a40] bg-[#1a1a2e] p-6 sm:p-8 prose prose-invert prose-sm max-w-none space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-white">
            1. Information We Collect
          </h2>
          <p className="text-gray-300">
            When you place an order, Stripe collects your payment and shipping
            information on our behalf. We receive your name, email address,
            shipping address, and order details. We also store the STL files you
            upload for the purpose of fulfilling your order.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">
            2. How We Use Your Information
          </h2>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>Process and fulfill your casting orders</li>
            <li>Send order confirmation and status update emails</li>
            <li>Respond to your questions or support requests</li>
            <li>Generate internal business reports and analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">
            3. Payment Processing
          </h2>
          <p className="text-gray-300">
            All payments are processed securely through Stripe. We never see,
            store, or have access to your full credit card number. Stripe&rsquo;s
            privacy policy governs the handling of your payment data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">4. File Storage</h2>
          <p className="text-gray-300">
            Uploaded STL files are stored temporarily for order fulfillment and
            are automatically deleted after 7 days. Files are not shared with
            third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">5. Email</h2>
          <p className="text-gray-300">
            We use Resend to send transactional emails (order confirmations,
            status updates). We do not send marketing emails or share your email
            address with third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">
            6. Cookies &amp; Analytics
          </h2>
          <p className="text-gray-300">
            We use a minimal session cookie for admin authentication. We do not
            use third-party tracking cookies or analytics services on the public
            site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">7. Data Retention</h2>
          <p className="text-gray-300">
            Order records are retained for accounting and legal purposes.
            Uploaded files are deleted after 7 days. You may request deletion of
            your personal data by emailing us at geegoco@gmail.com.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">8. Changes</h2>
          <p className="text-gray-300">
            We may update this policy from time to time. Changes will be posted
            on this page with an updated date.
          </p>
        </section>

        <p className="text-gray-500 text-xs pt-4">
          Last updated: February 2026
        </p>
      </div>
    </div>
  );
}
