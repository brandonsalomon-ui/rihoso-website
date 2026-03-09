import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sponsors & Supporters",
  description: "Our sponsors and supporters who help make RIHOSO events and programs possible.",
};

const sponsors = [
  { name: "Heritage Timepieces", tier: "Gold" },
  { name: "Providence Watch Co.", tier: "Gold" },
  { name: "New England Horology Supply", tier: "Silver" },
  { name: "Atlantic Clock Repair", tier: "Silver" },
  { name: "Narragansett Antiques", tier: "Silver" },
  { name: "Bay State Watch Parts", tier: "Bronze" },
  { name: "Ocean State Jewelers", tier: "Bronze" },
  { name: "Colonial Clockworks", tier: "Bronze" },
];

function SponsorCard({ name, tier }: { name: string; tier: string }) {
  const borderColor =
    tier === "Gold"
      ? "border-gold-400/50"
      : tier === "Silver"
      ? "border-cream-300/40"
      : "border-forest-500/40";

  return (
    <div
      className={`bg-forest-800/60 border ${borderColor} rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-gold-400/40 transition-colors min-h-[120px]`}
    >
      <div className="w-12 h-12 rounded-full bg-forest-700 flex items-center justify-center mb-3">
        <span className="text-cream-200 font-display text-lg font-bold">
          {name.charAt(0)}
        </span>
      </div>
      <p className="text-cream-100 font-display text-sm">{name}</p>
      <p className="text-xs text-gold-400 mt-1">{tier} Sponsor</p>
    </div>
  );
}

export default function SponsorsPage() {
  return (
    <section className="py-20 bg-forest-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-gold-400 text-sm uppercase tracking-[0.2em] mb-2 text-center">
          Our Partners
        </p>
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-cream-50 mb-4 text-center">
          Sponsors &amp; Supporters
        </h1>
        <p className="text-center text-cream-300 mb-16 max-w-2xl mx-auto">
          We are grateful to our sponsors and supporters who help make our events, programs, and
          educational initiatives possible.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {sponsors.map((sponsor) => (
            <SponsorCard key={sponsor.name} {...sponsor} />
          ))}
        </div>

        <div className="mt-16 text-center bg-forest-800/40 border border-forest-600/30 rounded-lg p-8">
          <h2 className="text-2xl font-display text-cream-50 mb-3">Become a Sponsor</h2>
          <p className="text-cream-300 text-sm mb-6 max-w-lg mx-auto">
            Interested in supporting the Rhode Island Horological Society? We offer
            multiple sponsorship tiers with visibility at events and on our website.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-gold-400 text-forest-950 px-8 py-3 rounded font-semibold hover:bg-gold-300 transition-colors"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </section>
  );
}
