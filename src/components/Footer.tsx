import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#2a2a40] bg-[#0a0a14]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-[#C9A84C] to-[#B8963F]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4 text-[#0f0f1a]"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <span className="text-sm font-bold tracking-wide text-white">
                GEEGO CASTING
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-gray-500">
              Precious metal jewelry casting services. Upload your 3D models and
              get instant quotes for gold, platinum, and silver casting.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C9A84C]">
              Quick Links
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  Casting Calculator
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C9A84C]">
              Legal
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  Terms &amp; Disclaimer
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C9A84C]">
              Contact
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="mailto:geegoco@gmail.com"
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  geegoco@gmail.com
                </a>
              </li>
              <li className="text-sm text-gray-500">
                Serving customers across the United States
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-[#1a1a2e] pt-6 text-center">
          <p className="text-xs text-gray-600">
            &copy; {currentYear} Geego Casting. All rights reserved. All quotes
            are estimates and subject to change.
          </p>
        </div>
      </div>
    </footer>
  );
}
