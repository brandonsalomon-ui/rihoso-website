"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "./Logo";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/memberships", label: "Memberships" },
  { href: "/blog", label: "Blog" },
  { href: "/watchmaking-schools", label: "Schools" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-forest-900/95 backdrop-blur-sm border-b border-forest-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo size="small" />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-body tracking-wide text-cream-200 hover:text-gold-400 transition-colors duration-300"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/memberships#join"
              className="ml-3 px-5 py-2 text-sm font-body tracking-widest uppercase bg-gold-400 text-forest-900 hover:bg-gold-300 transition-colors duration-300"
            >
              Join Now
            </Link>
          </nav>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-cream-200 hover:text-gold-400 transition-colors"
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {isOpen ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-forest-900/98 border-t border-forest-700/50">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 text-lg font-body text-cream-200 hover:text-gold-400 hover:bg-forest-800/50 transition-colors rounded"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/memberships#join"
              onClick={() => setIsOpen(false)}
              className="mt-2 mx-4 px-5 py-3 text-center text-sm font-body tracking-widest uppercase bg-gold-400 text-forest-900 hover:bg-gold-300 transition-colors"
            >
              Join Now
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
