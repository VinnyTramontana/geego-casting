"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#2a2a40] bg-[#0f0f1a]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#C9A84C] to-[#B8963F]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-6 w-6 text-[#0f0f1a]"
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
          <div>
            <span className="text-lg font-bold tracking-wide text-white group-hover:text-[#C9A84C] transition-colors">
              GEEGO
            </span>
            <span className="ml-1 text-sm font-light tracking-widest text-gray-400">
              CASTING
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-gray-300 transition-colors hover:text-[#C9A84C]"
          >
            Calculator
          </Link>
          <Link
            href="/faq"
            className="text-sm font-medium text-gray-300 transition-colors hover:text-[#C9A84C]"
          >
            FAQ
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-gray-300 transition-colors hover:text-[#C9A84C]"
          >
            Contact
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-[#1a1a2e] hover:text-white md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[#2a2a40] bg-[#0f0f1a] px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-2">
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1a2e] hover:text-[#C9A84C]"
              onClick={() => setMobileOpen(false)}
            >
              Calculator
            </Link>
            <Link
              href="/faq"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1a2e] hover:text-[#C9A84C]"
              onClick={() => setMobileOpen(false)}
            >
              FAQ
            </Link>
            <Link
              href="/contact"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1a2e] hover:text-[#C9A84C]"
              onClick={() => setMobileOpen(false)}
            >
              Contact
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
