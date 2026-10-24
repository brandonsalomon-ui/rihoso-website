import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import SponsorCarousel from "@/components/SponsorCarousel";
import { Gear, Icon } from "@/components/ornaments";
import { SPONSORS } from "@/lib/sponsors";

export const metadata: Metadata = {
  title: "Sponsors & Supporters",
  description: "Our sponsors and supporters who help make RIHOSO events and programs possible.",
};

export default function SponsorsPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Partners"
        title="Sponsors & Supporters"
        subtitle="We are grateful to our sponsors and supporters who help make our events, programs, and educational initiatives possible."
      >
        <p className="inline-flex items-baseline gap-3 rounded-full border border-gold-400/25 bg-forest-950/40 backdrop-blur-sm px-6 py-2">
          <span className="font-display text-3xl font-bold text-gold-foil">{SPONSORS.length}</span>
          <span className="text-xs uppercase tracking-[0.25em] text-cream-300">Partners &amp; Supporters</span>
        </p>
      </PageHero>

      <section className="relative py-20 sm:py-24 bg-forest-800 overflow-hidden">
        <div className="absolute inset-0 bg-guilloche opacity-50 pointer-events-none" />
        <Reveal className="relative">
          <SponsorCarousel sponsors={SPONSORS} />
          <p className="mt-8 text-center text-sm text-cream-400">Hover to pause.</p>
        </Reveal>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <Reveal>
            <div className="relative overflow-hidden text-center rounded-2xl panel-lux p-10 sm:p-12">
              <div className="pointer-events-none absolute -right-16 -top-16 text-gold-400/10">
                <Gear className="w-56 h-56 animate-rotate-slow" teeth={26} />
              </div>
              <div className="pointer-events-none absolute -left-12 -bottom-16 text-gold-400/10">
                <Gear className="w-44 h-44 animate-rotate-slow-reverse" teeth={18} />
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
