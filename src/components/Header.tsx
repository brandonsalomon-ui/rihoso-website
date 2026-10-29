"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/memberships", label: "Memberships" },
  { href: "/marketplace", label: "Watch Exchange" },
  { href: "/repairs", label: "Repairs" },
  { href: "/blog", label: "Blog" },
  { href: "/watchmaking-schools", label: "Schools" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-forest-900/95 backdrop-blur-sm border-b border-gold-400/10 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo size="small" />
          </Link>

          <nav className="hidden xl:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`relative whitespace-nowrap px-2.5 2xl:px-3 py-2 text-sm font-body tracking-wide transition-colors duration-300 hover:text-gold-400 after:absolute after:left-2.5 after:right-2.5 2xl:after:left-3 2xl:after:right-3 after:-bottom-0.5 after:h-px after:bg-gold-400 after:origin-center after:transition-transform after:duration-300 hover:after:scale-x-100 ${
                  isActive(item.href) ? "text-gold-300 after:scale-x-100" : "text-cream-200 after:scale-x-0"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/memberships#join"
              className="btn-gold ml-3 px-5 py-2 text-sm font-body tracking-widest uppercase"
            >
              Join Now
            </Link>
          </nav>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="xl:hidden p-2 text-cream-200 hover:text-gold-400 transition-colors"
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
        <div className="xl:hidden bg-forest-900/98 border-t border-forest-700/50">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`px-4 py-3 text-lg font-body hover:text-gold-400 hover:bg-forest-800/50 transition-colors rounded ${isActive(item.href) ? "text-gold-300 bg-forest-800/50" : "text-cream-200"}`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/memberships#join"
              onClick={() => setIsOpen(false)}
              className="btn-gold mt-2 mx-4 px-5 py-3 text-center text-sm font-body tracking-widest uppercase"
            >
              Join Now
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
