import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-1">
            <span className="font-display text-2xl text-white">
              Brandon Salomon
            </span>
            <p className="mt-4 text-navy-300 font-body text-base leading-relaxed max-w-sm">
              Guiding leaders and organizations through the AI transformation
              with clarity, confidence, and real-world strategy.
            </p>
          </div>

          <div>
            <h4 className="text-tan-400 font-semibold text-sm tracking-wider uppercase mb-6">
              Navigate
            </h4>
            <ul className="space-y-3">
              {[
                { href: "/about", label: "About" },
                { href: "/services", label: "Services" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-navy-300 hover:text-tan-400 font-body transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-tan-400 font-semibold text-sm tracking-wider uppercase mb-6">
              Services
            </h4>
            <ul className="space-y-3">
              {[
                { href: "/services#consulting", label: "AI Consulting" },
                { href: "/services#training", label: "Team Training" },
                { href: "/services#speaking", label: "Speaking Engagements" },
                { href: "/services#leadership", label: "Leadership Coaching" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-navy-300 hover:text-tan-400 font-body transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="gradient-divider mt-16 mb-8 opacity-30" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-navy-400 font-body text-sm">
            &copy; {new Date().getFullYear()} Brandon Salomon. All rights
            reserved.
          </p>
          <p className="text-navy-500 font-body text-sm">
            Empowering teams through AI leadership
          </p>
        </div>
      </div>
    </footer>
  );
}
