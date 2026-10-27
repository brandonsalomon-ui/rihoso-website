import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { formatDate } from "@/lib/market/format";
import { getOverview, marketAvailable } from "@/lib/market/queries";
import type { MarketSource } from "@/lib/market/types";

export const metadata: Metadata = {
  title: "How the Market Tracker works",
  description: "Sources, methods and limits of RIHOSO's pre-owned watch market tracker.",
};
export const revalidate = 3600;

const SECTIONS = [
  {
    title: "What we collect",
    body: "Once a day we read the public pre-owned listings of the sources below: brand, collection, reference, year, dial, case, bracelet, box and papers, and the asking price, plus a link back to the listing. We don't copy photos or descriptions. RIHOSO's own Watch Exchange listings are included too.",
  },
  {
    title: "Days on market",
    body: "A listing's clock starts the first day we see it. Listings that were already up when we started tracking a source show their days with a “+”, because their true age is longer than we can see.",
  },
  {
    title: "Leaving the market",
    body: "When a listing disappears from its source, we record the day it left. That usually means it sold, but it may also have been withdrawn, so we don't call it a sale. Only the RIHOSO Watch Exchange tells us for certain when a watch sold. If a day's collection doesn't see nearly a source's whole selection, we don't record any exits that day, so a glitch never looks like a wave of sales.",
  },
  {
    title: "Prices",
    body: "All prices are asking prices from the listing, not what a watch actually sold for. Median prices combine every tracked source. Price cuts compare today's asking price with the first one we saw for that listing.",
  },
  {
    title: "Our approach to sources",
    body: "We only collect from sites whose terms allow it, we follow each site's robots.txt, and we identify ourselves as the RIHOSO Market Tracker. Sites whose terms prohibit automated collection are not included without written permission. Retailers who'd like their listings included, or removed, can reach us through the contact page.",
  },
];

export default async function MarketAboutPage() {
  let sources: MarketSource[] = [];
  if (marketAvailable()) {
    try {
      sources = (await getOverview()).sources.filter((s) => s.enabled);
    } catch {
      sources = [];
    }
  }

  return (
    <>
      <PageHero eyebrow="Market Tracker" title="How it works" subtitle="Where the numbers come from, what they mean, and what they don't." />
      <section className="py-14 sm:py-20 bg-forest-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="font-display text-2xl text-cream-50">{s.title}</h2>
              <p className="mt-3 text-lg text-cream-200 leading-relaxed">{s.body}</p>
            </div>
          ))}

          {sources.length > 0 && (
            <div>
              <h2 className="font-display text-2xl text-cream-50">Sources</h2>
              <ul className="mt-4 space-y-4">
                {sources.map((s) => (
                  <li key={s.id} className="panel-lux rounded-lg p-5">
                    <p className="flex items-baseline justify-between gap-3">
                      <span className="font-display text-lg text-cream-50">{s.name}</span>
                      <span className="text-xs uppercase tracking-[0.18em] text-gold-300">Tracked</span>
                    </p>
                    {s.terms_note && <p className="mt-2 text-sm text-cream-300 leading-relaxed">{s.terms_note}</p>}
                    {s.terms_checked_on && <p className="mt-2 text-xs text-cream-400">Terms reviewed {formatDate(s.terms_checked_on)}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-sm text-cream-400 leading-relaxed">
            RIHOSO is an independent nonprofit and is not affiliated with, or endorsed by, any watch brand or retailer shown
            here. Brand and model names are trademarks of their owners and are used only to identify the watches. Nothing on
            this page is an offer, an appraisal or investment advice.
          </p>
          <Link href="/market" className="inline-block text-gold-400 hover:text-gold-300">
            ← Back to the tracker
          </Link>
        </div>
      </section>
    </>
  );
}
