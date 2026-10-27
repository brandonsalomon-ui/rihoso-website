import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import ListingRow from "@/components/market/ListingRow";
import PriceHistoryChart from "@/components/market/PriceHistoryChart";
import StatTile from "@/components/market/StatTile";
import { formatUsd } from "@/lib/market/format";
import { getReference, getSourceNames, marketAvailable } from "@/lib/market/queries";

export const revalidate = 900;

type Params = { brand: string; ref: string };

const brandFromSlug = (slug: string) => decodeURIComponent(slug).replace(/-/g, " ");
const refFromSlug = (slug: string) => decodeURIComponent(slug).toUpperCase().replace(/[^A-Z0-9]/g, "");

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const brand = brandFromSlug(params.brand);
  const ref = refFromSlug(params.ref);
  return {
    title: `${brand.replace(/\b\w/g, (c) => c.toUpperCase())} ${ref} — Market Tracker`,
    description: `Asking prices, supply and time on market for reference ${ref}, tracked daily by RIHOSO.`,
  };
}

export default async function ReferencePage({ params }: { params: Params }) {
  if (!marketAvailable()) notFound();
  const brand = brandFromSlug(params.brand);
  const key = refFromSlug(params.ref);
  if (!key) notFound();

  const [{ stats, listings, daily }, sourceNames] = await Promise.all([getReference(brand, key), getSourceNames()]);
  if (!listings.length) notFound();

  const active = listings.filter((l) => l.status === "active");
  const gone = listings
    .filter((l) => l.status === "gone")
    .sort((a, b) => new Date(b.gone_at ?? 0).getTime() - new Date(a.gone_at ?? 0).getTime());
  const sample = listings[0];
  const displayBrand = sample.brand;
  const displayRef = stats?.reference ?? sample.reference ?? key;
  const model = stats?.model ?? sample.model;

  return (
    <>
      <PageHero eyebrow={displayBrand} title={`${model ? `${model} ` : ""}${displayRef}`} subtitle="Asking prices, supply and time on market, tracked daily." />

      <section className="bg-forest-800 py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/market" className="text-sm text-gold-400 hover:text-gold-300">
            ← All listings
          </Link>

          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile
              label="Median ask"
              value={formatUsd(stats?.median_cents)}
              note={stats?.min_cents != null ? `range ${formatUsd(stats.min_cents, { compact: true })} – ${formatUsd(stats.max_cents, { compact: true })}` : undefined}
            />
            <StatTile label="Listed now" value={String(stats?.active_count ?? active.length)} note={`across ${stats?.source_count ?? 0} sources`} />
            <StatTile
              label="Median time listed"
              value={stats?.median_age_days != null ? `${Math.round(stats.median_age_days)} d` : "—"}
              note="current listings"
            />
            <StatTile
              label="Days to leave"
              value={stats?.median_days_to_leave != null ? `${Math.round(stats.median_days_to_leave)} d` : "—"}
              note={stats?.observed_exits ? `median of ${stats.observed_exits} exits` : "builds as listings leave"}
            />
          </div>

          <div className="mt-8 panel-lux rounded-xl p-5 sm:p-6">
            <h2 className="font-display text-xl text-cream-50">Median asking price</h2>
            <p className="mt-1 mb-4 text-sm text-cream-400">Across all tracked sources, one point per day.</p>
            <PriceHistoryChart points={daily} title={`Median asking price for ${displayRef}`} />
          </div>

          <h2 className="mt-12 font-display text-2xl text-cream-50">Listed now ({active.length})</h2>
          {active.length ? (
            <ul className="mt-4 space-y-3">
              {active.map((l) => (
                <ListingRow key={l.id} listing={l} sourceName={sourceNames[l.source_id] ?? l.source_id} />
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-cream-300">None listed right now.</p>
          )}

          {gone.length > 0 && (
            <>
              <h2 className="mt-12 font-display text-2xl text-cream-50">Left the market ({gone.length})</h2>
              <p className="mt-1 text-sm text-cream-400">Sold or withdrawn; only the RIHOSO Watch Exchange tells us which.</p>
              <ul className="mt-4 space-y-3">
                {gone.slice(0, 40).map((l) => (
                  <ListingRow key={l.id} listing={l} sourceName={sourceNames[l.source_id] ?? l.source_id} />
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </>
  );
}
