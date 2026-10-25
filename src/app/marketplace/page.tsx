import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { COMMISSION, SERVICES, formatUsd } from "@/lib/marketplace";

export const metadata: Metadata = {
  title: "Watch Exchange",
  description:
    "The RIHOSO Watch Exchange — a marketplace for collectors to list and sell watches, with optional member validation and repair.",
};

const STEPS = [
  {
    title: "List your watch",
    body: "Set up a seller account, upload photos and describe the watch: reference, condition, box and papers, service history.",
  },
  {
    title: "Talk with buyers",
    body: "Buyers and sellers message each other through RIHOSO, so contact details stay private until a deal is made.",
  },
  {
    title: "Get paid safely",
    body: "The buyer pays through RIHOSO. Payment is held until the buyer confirms the watch arrived as described, then released to the seller.",
  },
];

export default function MarketplacePage() {
  return (
    <>
      <PageHero
        eyebrow="Coming Soon"
        title="Watch Exchange"
        subtitle="A marketplace for watches only — run by collectors, for collectors."
      />

      <section className="py-20 sm:py-24 bg-forest-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.title} className="card-lux rounded-xl p-8">
                <p className="text-gold-400 font-display text-3xl mb-3">{i + 1}</p>
                <h2 className="text-xl font-display text-cream-50 mb-2">{s.title}</h2>
                <p className="text-sm text-cream-300 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="panel-lux rounded-xl p-8">
              <p className="text-gold-400 text-sm uppercase tracking-[0.2em] mb-2">Optional</p>
              <h2 className="text-2xl font-display text-cream-50 mb-1">{SERVICES.validation.name}</h2>
              <p className="font-display text-3xl text-gold-foil mb-4">{formatUsd(SERVICES.validation.priceCents)}</p>
              <p className="text-cream-300 text-sm leading-relaxed">{SERVICES.validation.summary}</p>
            </div>
            <div className="panel-lux rounded-xl p-8">
              <p className="text-gold-400 text-sm uppercase tracking-[0.2em] mb-2">Optional</p>
              <h2 className="text-2xl font-display text-cream-50 mb-1">{SERVICES.repair.name}</h2>
              <p className="font-display text-3xl text-gold-foil mb-4">By quote</p>
              <p className="text-cream-300 text-sm leading-relaxed">{SERVICES.repair.summary}</p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-3xl font-display font-bold text-cream-50 mb-3">Selling fees</h2>
            <p className="text-cream-300 max-w-xl mx-auto">
              No fee to list. When your watch sells, RIHOSO keeps {COMMISSION.standard * 100}% of the sale price —
              or just {COMMISSION.member * 100}% for{" "}
              <Link href="/memberships" className="text-gold-400 hover:text-gold-300">
                RIHOSO members
              </Link>
              .
            </p>
            <Link href="/marketplace/sell" className="btn-gold inline-block mt-8 px-8 py-3 font-semibold tracking-widest uppercase text-sm">
              Become a seller
            </Link>
          </div>

          <p className="mt-16 text-xs text-cream-400 max-w-3xl mx-auto text-center leading-relaxed">
            RIHOSO provides the venue and payment handling. Watches are sold by independent sellers, who are responsible
            for their listings. RIHOSO is not the seller and does not guarantee any item. Member validations are an
            expert opinion, not a warranty of authenticity.
          </p>
        </div>
      </section>
    </>
  );
}
