export const metadata = {
  title: "Terms of Service | Geego Casting",
  description: "Terms of service for Geego Casting precious metal casting services.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] bg-clip-text text-transparent mb-8">
        Terms of Service
      </h1>

      <div className="rounded-xl border border-[#2a2a40] bg-[#1a1a2e] p-6 sm:p-8 prose prose-invert prose-sm max-w-none space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-white">1. Overview</h2>
          <p className="text-gray-300">
            These Terms of Service govern your use of the Geego Casting website
            and casting services. By placing an order, you agree to be bound by
            these terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">
            2. Pricing &amp; Payment
          </h2>
          <p className="text-gray-300">
            All quotes are estimates based on live metal spot prices at the time
            of calculation. The final price is locked when you complete payment
            via Stripe Checkout. We do not store your credit card information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">
            3. Order Processing
          </h2>
          <p className="text-gray-300">
            Once payment is confirmed, your order enters our production queue.
            Standard orders ship within approximately 2&ndash;3 weeks. Rush
            orders are prioritized and typically ship within 1 week. Timelines
            are estimates and not guaranteed.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">4. File Upload</h2>
          <p className="text-gray-300">
            You are responsible for ensuring uploaded STL files are accurate
            representations of your desired casting. We cast based on the model
            provided. Geego Casting is not liable for errors in your 3D model.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">
            5. Returns &amp; Refunds
          </h2>
          <p className="text-gray-300">
            Due to the custom nature of cast jewelry, all sales are final.
            Refunds are only issued if we are unable to fulfill the order or if
            there is a defect in craftsmanship. Contact us within 7 days of
            receiving your order to report issues.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">6. Shipping</h2>
          <p className="text-gray-300">
            We currently ship within the United States only. A flat shipping fee
            of $25 is included in every order. Risk of loss transfers to the
            buyer once the package is handed to the carrier.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">
            7. Intellectual Property
          </h2>
          <p className="text-gray-300">
            You retain all rights to your uploaded 3D models. By uploading, you
            grant Geego Casting a limited license to use the files solely for
            fulfilling your order. We do not share or redistribute your files.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">
            8. Limitation of Liability
          </h2>
          <p className="text-gray-300">
            Geego Casting&rsquo;s total liability is limited to the amount paid
            for the order in question. We are not liable for indirect,
            incidental, or consequential damages.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">9. Changes</h2>
          <p className="text-gray-300">
            We reserve the right to update these terms at any time. Continued
            use of the service after changes constitutes acceptance of the
            revised terms.
          </p>
        </section>

        <p className="text-gray-500 text-xs pt-4">
          Last updated: February 2026
        </p>
      </div>
    </div>
  );
}
