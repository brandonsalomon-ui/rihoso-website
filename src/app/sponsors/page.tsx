import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { Gear, GuillocheRosette, Icon } from "@/components/ornaments";

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

const TIER_STYLE: Record<string, { ring: string; text: string; glow: string }> = {
  Gold: {
    ring: "from-[#f9f0d6] via-[#c9a84c] to-[#7d5a26]",
    text: "text-gold-300",
    glow: "group-hover:shadow-[0_0_40px_-6px_rgba(201,168,76,0.6)]",
  },
  Silver: {
    ring: "from-[#ffffff] via-[#b9bfc4] to-[#5f666b]",
    text: "text-cream-200",
    glow: "group-hover:shadow-[0_0_40px_-6px_rgba(220,225,230,0.45)]",
  },
  Bronze: {
    ring: "from-[#f3c9a0] via-[#b07a4a] to-[#5e3a1e]",
    text: "text-[#d9a77a]",
    glow: "group-hover:shadow-[0_0_40px_-6px_rgba(176,122,74,0.55)]",
  },
};

function SponsorCard({ name, tier }: { name: string; tier: string }) {
  const t = TIER_STYLE[tier];
  const big = tier === "Gold";
  return (
    <div className="card-lux group h-full rounded-xl p-6 flex flex-col items-center justify-center text-center">
      <div
        className={`relative rounded-full p-[2px] bg-gradient-to-br ${t.ring} ${t.glow} transition-shadow duration-500 ${
          big ? "w-24 h-24" : "w-16 h-16"
        }`}
      >
        <div className="w-full h-full rounded-full bg-forest-950 flex items-center justify-center relative overflow-hidden">
          <GuillocheRosette className="absolute inset-0 w-full h-full text-gold-400/15 group-hover:animate-rotate-medium" />
          <span className={`relative font-display font-bold ${t.text} ${big ? "text-4xl" : "text-2xl"}`}>
            {name.charAt(0)}
          </span>
        </div>
      </div>
      <p className={`mt-4 text-cream-50 font-display ${big ? "text-xl" : "text-base"}`}>{name}</p>
    </div>
  );
}

export default function SponsorsPage() {
  const tiers = ["Gold", "Silver", "Bronze"];
  return (
    <>
      <PageHero
        eyebrow="Our Partners"
        title="Sponsors & Supporters"
        subtitle="We are grateful to our sponsors and supporters who help make our events, programs, and educational initiatives possible."
      />

      <section className="py-20 sm:py-24 bg-forest-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {tiers.map((tier) => {
            const list = sponsors.filter((s) => s.tier === tier);
            if (!list.length) return null;
            return (
              <div key={tier}>
                <Reveal className="flex items-center gap-4 mb-8">
                  <span className={`h-px flex-1 bg-gradient-to-r from-transparent ${tier === "Gold" ? "to-gold-400/60" : "to-cream-300/30"}`} />
                  <h2 className={`font-display text-sm uppercase tracking-[0.35em] ${TIER_STYLE[tier].text}`}>
                    {tier} Sponsors
                  </h2>
                  <span className={`h-px flex-1 bg-gradient-to-l from-transparent ${tier === "Gold" ? "to-gold-400/60" : "to-cream-300/30"}`} />
                </Reveal>
                <div
                  className={`grid gap-5 ${
                    tier === "Gold" ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto" : "grid-cols-2 sm:grid-cols-3"
                  }`}
                >
                  {list.map((sponsor, i) => (
                    <Reveal key={sponsor.name} delay={i * 100} className="h-full">
                      <SponsorCard {...sponsor} />
                    </Reveal>
                  ))}
                </div>
              </div>
            );
          })}

          <Reveal>
            <div className="relative overflow-hidden text-center rounded-2xl panel-lux p-10 sm:p-12">
              <div className="pointer-events-none absolute -right-16 -top-16 text-gold-400/10">
                <Gear className="w-56 h-56 animate-rotate-slow" teeth={26} />
              </div>
              <h2 className="relative text-3xl font-display text-cream-50 mb-3">Become a Sponsor</h2>
              <p className="relative text-cream-300 text-lg mb-8 max-w-lg mx-auto">
                Interested in supporting the Rhode Island Horological Society? We offer
                multiple sponsorship tiers with visibility at events and on our website.
              </p>
              <Link
                href="/contact"
                className="btn-gold relative inline-flex items-center gap-2 px-8 py-3 tracking-widest uppercase"
              >
                Get in Touch
                <Icon name="arrow" className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
