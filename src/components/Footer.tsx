import Link from "next/link";
import Logo from "./Logo";
import { GuillocheRosette } from "./ornaments";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-forest-950 border-t border-gold-400/10">
      <div className="pointer-events-none absolute -right-48 -bottom-48 text-gold-400/[0.05]">
        <GuillocheRosette className="w-[520px] h-[520px] animate-rotate-slow-reverse" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 text-cream-300 font-body text-lg leading-relaxed max-w-md">
              Preserving the history, culture and traditions of watchmaking through local community
              outreach, support and continued education.
            </p>
          </div>

          <div>
            <h4 className="text-gold-400 font-display text-sm tracking-widest uppercase mb-4">Navigate</h4>
            <ul className="space-y-2">
              {[
                { href: "/about", label: "About RIHOSO" },
                { href: "/events", label: "Events" },
                { href: "/memberships", label: "Memberships" },
                { href: "/marketplace", label: "Watch Exchange" },
                { href: "/blog", label: "Blog" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-cream-300 hover:text-gold-400 font-body transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-gold-400 font-display text-sm tracking-widest uppercase mb-4">Resources</h4>
            <ul className="space-y-2">
              {[
                { href: "/students", label: "Students & Schools" },
                { href: "/watchmaking-schools", label: "Watchmaking Schools" },
                { href: "/sponsors", label: "Sponsors" },
                { href: "/memberships#join", label: "Join Now" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-cream-300 hover:text-gold-400 font-body transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-forest-700/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-cream-400 font-body text-sm">
            &copy; {new Date().getFullYear()} Rhode Island Horological Society. All rights reserved.
            <span className="block sm:inline sm:ml-4">
              <Link href="/terms" className="hover:text-gold-400">Terms</Link>
              <span className="mx-2">·</span>
              <Link href="/privacy" className="hover:text-gold-400">Privacy</Link>
            </span>
          </p>
          <div className="flex items-center gap-1 text-cream-400 font-body text-sm">
            <span>Dedicated to the art and science of horology</span>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-gold-400 ml-1" fill="currentColor">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <line x1="12" y1="5" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="12" y1="12" x2="17" y2="14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
    </footer>
  );
}
