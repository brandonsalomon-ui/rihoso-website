import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import ExchangeNav from "@/components/exchange/ExchangeNav";
import ListingCard from "@/components/exchange/ListingCard";
import { COMMISSION, REPAIRS_OPEN, SERVICES } from "@/lib/marketplace";
import { MEMBERSHIP_TIERS } from "@/lib/membership";
import { LISTING_SELECT, type Listing } from "@/lib/exchange-types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Watch Exchange",
  description:
    "The RIHOSO Watch Exchange — a marketplace for collectors to list and sell watches, with repair and service by quote.",
};
export const dynamic = "force-dynamic";

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
    body: "The buyer pays through RIHOSO and the payment is held. Once the watch arrives, the buyer has 72 hours to inspect it; then the seller is paid.",
  },
];

async function loadListings(q: string) {
  const { supabase, user } = await getUser();
  let query = supabase
    .from("listings")
    .select(LISTING_SELECT)
    .in("status", ["active", "reserved"])
    .order("published_at", { ascending: false })
    .limit(48);
  if (q) {
    const term = q.replace(/[%_,()]/g, " ").trim();
    if (term) query = query.or(`brand.ilike.%${term}%,title.ilike.%${term}%,reference.ilike.%${term}%`);
  }
  const { data } = await query;
  return { listings: (data ?? []) as unknown as Listing[], signedIn: Boolean(user) };
}

export default async function MarketplacePage({ searchParams }: { searchParams: { q?: string } }) {
  const live = isSupabaseConfigured();
  const q = (searchParams.q ?? "").slice(0, 60);
  const { listings, signedIn } = live ? await loadListings(q) : { listings: [], signedIn: false };

  return (
    <>
      <PageHero
        eyebrow={live ? "RIHOSO" : "Coming Soon"}
        title="Watch Exchange"
        subtitle="A marketplace for watches only — run by collectors, for collectors."
      />
      {live && <ExchangeNav signedIn={signedIn} />}

      {live && (
        <section className="py-14 bg-forest-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <form className="flex gap-3 max-w-xl mb-10" action="/marketplace">
              <input
                name="q"
                defaultValue={q}
                placeholder="Search brand, model or reference"
                className="flex-1 bg-forest-900 border border-forest-600/50 rounded px-4 py-3 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60"
              />
              <button className="btn-gold px-6 rounded font-semibold">Search</button>
            </form>

            {listings.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {listings.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            ) : (
              <div className="panel-lux rounded-xl p-10 text-center">
                <p className="text-cream-200 text-lg mb-2">
                  {q ? `No watches match “${q}” yet.` : "No watches listed yet — be the first."}
                </p>
                <Link href="/marketplace/sell" className="text-gold-400 hover:text-gold-300">List a watch</Link>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="py-20 sm:py-24 bg-forest-800 border-t border-gold-400/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-display font-bold text-cream-50 mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.title} className="card-lux rounded-xl p-8">
                <p className="text-gold-400 font-display text-3xl mb-3">{i + 1}</p>
                <h3 className="text-xl font-display text-cream-50 mb-2">{s.title}</h3>
                <p className="text-sm text-cream-300 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="panel-lux rounded-xl p-8">
              <p className="text-gold-400 text-sm uppercase tracking-[0.2em] mb-2">Members sell for less</p>
              <h3 className="text-2xl font-display text-cream-50 mb-1">RIHOSO Membership</h3>
              <p className="font-display text-3xl text-gold-foil mb-4">
                {MEMBERSHIP_TIERS[0].price}
                <span className="text-cream-400 text-sm font-body ml-1">/year</span>
              </p>
              <p className="text-cream-300 text-sm leading-relaxed">
                Members pay a {COMMISSION.member * 100}% selling fee instead of {COMMISSION.standard * 100}%, plus monthly
                meetings, events and the newsletter.
              </p>
              <Link href="/memberships#join" className="inline-block mt-4 text-gold-400 hover:text-gold-300 text-sm">
                Become a member →
              </Link>
            </div>
            {REPAIRS_OPEN && (
            <div className="panel-lux rounded-xl p-8">
              <p className="text-gold-400 text-sm uppercase tracking-[0.2em] mb-2">Optional</p>
              <h3 className="text-2xl font-display text-cream-50 mb-1">{SERVICES.repair.name}</h3>
              <p className="font-display text-3xl text-gold-foil mb-4">By quote</p>
              <p className="text-cream-300 text-sm leading-relaxed">{SERVICES.repair.summary}</p>
              {live && (
                <Link href="/marketplace/repair" className="inline-block mt-4 text-gold-400 hover:text-gold-300 text-sm">
                  Request a repair quote →
                </Link>
              )}
            </div>
            )}
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
            <p className="text-cream-300 max-w-xl mx-auto mt-3">
              Sellers receive the sale price minus the fee. RIHOSO&apos;s fees and membership dues support the society&apos;s
              education programs, watchmaking scholarships and operating costs.
            </p>
            <Link href="/marketplace/sell" className="btn-gold inline-block mt-8 px-8 py-3 font-semibold tracking-widest uppercase text-sm">
              Become a seller
            </Link>
          </div>

          <p className="mt-16 text-xs text-cream-400 max-w-3xl mx-auto text-center leading-relaxed">
            RIHOSO provides the venue and payment handling. Watches are sold by independent sellers, who are responsible
            for their listings. RIHOSO is not the seller and does not guarantee any item.
          </p>
        </div>
      </section>
    </>
  );
}
