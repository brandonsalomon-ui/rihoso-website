import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import ListingRow from "@/components/market/ListingRow";
import RankingPanel from "@/components/market/RankingPanel";
import StatTile from "@/components/market/StatTile";
import { daysOnMarketLabel, formatDate, formatPct, formatUsd, pctChange, referenceSlug } from "@/lib/market/format";
import {
  getListings,
  getModels,
  getOverview,
  getRankings,
  getSourceNames,
  marketAvailable,
  PAGE_SIZE,
  SORTS,
  type ListingFilters,
  type SortKey,
} from "@/lib/market/queries";

export const metadata: Metadata = {
  title: "Market Tracker",
  description:
    "RIHOSO's pre-owned watch market tracker: asking prices, price cuts and time on market, collected daily from public retailer listings and the RIHOSO Watch Exchange.",
};
export const revalidate = 900;

type Search = { q?: string; model?: string; source?: string; status?: string; sort?: string; page?: string; min?: string; max?: string };

function parseFilters(s: Search): ListingFilters {
  const num = (v?: string) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
  };
  return {
    q: s.q?.slice(0, 60) || undefined,
    model: s.model?.slice(0, 80) || undefined,
    source: s.source?.slice(0, 40) || undefined,
    status: s.status === "gone" ? "gone" : "active",
    sort: (s.sort && s.sort in SORTS ? s.sort : "longest") as SortKey,
    page: num(s.page) ?? 1,
    minPrice: num(s.min),
    maxPrice: num(s.max),
  };
}

function hrefWith(s: Search, change: Partial<Search>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...s, ...change })) if (v) params.set(k, String(v));
  const qs = params.toString();
  return `/market${qs ? `?${qs}` : ""}`;
}

export default async function MarketPage({ searchParams }: { searchParams: Search }) {
  if (!marketAvailable()) return <ComingSoon />;
  const filters = parseFilters(searchParams);

  let loaded;
  try {
    loaded = await Promise.all([getOverview(), getListings(filters), getRankings(), getModels(), getSourceNames()]);
  } catch (err) {
    console.error("[market] page load failed", err);
    return <ComingSoon />;
  }
  const [overview, { listings, total, page }, rankings, models, sourceNames] = loaded;
  if (!overview.activeCount && !total) return <ComingSoon />;

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const enabledSources = overview.sources.filter((s) => s.enabled);
  const field =
    "w-full bg-forest-900 border border-forest-600/50 rounded px-3 py-2.5 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60";

  return (
    <>
      <PageHero
        eyebrow="RIHOSO"
        title="Market Tracker"
        subtitle="Pre-owned asking prices and time on market, collected every day from public retailer listings and the RIHOSO Watch Exchange."
      />

      <section className="bg-forest-800 border-b border-gold-400/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile label="Listed now" value={overview.activeCount.toLocaleString()} note={`${enabledSources.length} sources`} />
            <StatTile label="New this week" value={overview.added7d.toLocaleString()} note="first seen in the last 7 days" />
            <StatTile label="Left this week" value={overview.gone7d.toLocaleString()} note="sold or withdrawn" />
            <StatTile label="Updated" value={overview.updatedAt ? formatDate(overview.updatedAt).replace(/, \d{4}$/, "") : "—"} note="collected daily" />
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-forest-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Listings */}
          <div className="lg:col-span-8">
            <form action="/market" className="panel-lux rounded-xl p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-6 gap-3">
              <label className="col-span-2 sm:col-span-3">
                <span className="sr-only">Search</span>
                <input name="q" defaultValue={filters.q} placeholder="Model, reference, dial or metal" className={field} />
              </label>
              <label className="col-span-1 sm:col-span-3">
                <span className="sr-only">Collection</span>
                <select name="model" defaultValue={filters.model ?? ""} className={field}>
                  <option value="">All collections</option>
                  {models.map((m) => (
                    <option key={m.model} value={m.model}>
                      {m.model} ({m.count})
                    </option>
                  ))}
                </select>
              </label>
              <label className="col-span-1 sm:col-span-2">
                <span className="sr-only">Source</span>
                <select name="source" defaultValue={filters.source ?? ""} className={field}>
                  <option value="">All sources</option>
                  {enabledSources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="col-span-1 sm:col-span-1">
                <span className="sr-only">Minimum price</span>
                <input name="min" inputMode="numeric" defaultValue={filters.minPrice} placeholder="Min $" className={field} />
              </label>
              <label className="col-span-1 sm:col-span-1">
                <span className="sr-only">Maximum price</span>
                <input name="max" inputMode="numeric" defaultValue={filters.maxPrice} placeholder="Max $" className={field} />
              </label>
              <label className="col-span-2 sm:col-span-2">
                <span className="sr-only">Sort</span>
                <select name="sort" defaultValue={filters.sort} className={field}>
                  {Object.entries(SORTS).map(([key, s]) => (
                    <option key={key} value={key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <input type="hidden" name="status" value={filters.status === "gone" ? "gone" : ""} />
              <div className="col-span-2 sm:col-span-6 flex items-center justify-between gap-3">
                <div className="flex gap-1 text-sm" role="tablist" aria-label="Listing status">
                  {(["active", "gone"] as const).map((st) => (
                    <Link
                      key={st}
                      href={hrefWith(searchParams, { status: st === "gone" ? "gone" : undefined, page: undefined })}
                      aria-current={filters.status === st ? "page" : undefined}
                      className={`px-3 py-1.5 rounded-full border transition-colors ${
                        filters.status === st
                          ? "border-gold-400/60 bg-gold-400/10 text-gold-200"
                          : "border-forest-600/50 text-cream-300 hover:text-gold-300"
                      }`}
                    >
                      {st === "active" ? "Listed now" : "Left the market"}
                    </Link>
                  ))}
                </div>
                <button className="btn-gold px-6 py-2 rounded font-semibold">Apply</button>
              </div>
            </form>

            <div className="mt-6 flex items-baseline justify-between">
              <p className="text-cream-300 text-sm">
                <span className="text-cream-50 font-display text-lg tabular-nums">{total.toLocaleString()}</span>{" "}
                {filters.status === "gone" ? "watches have left the market" : "watches listed"}
                {filters.q || filters.model || filters.source || filters.minPrice || filters.maxPrice ? " matching your filters" : ""}
              </p>
              {(filters.q || filters.model || filters.source || filters.minPrice || filters.maxPrice) && (
                <Link href={hrefWith({}, { status: filters.status === "gone" ? "gone" : undefined })} className="text-sm text-gold-400 hover:text-gold-300">
                  Clear filters
                </Link>
              )}
            </div>

            {listings.length ? (
              <ul className="mt-4 space-y-3">
                {listings.map((l) => (
                  <ListingRow key={l.id} listing={l} sourceName={sourceNames[l.source_id] ?? l.source_id} />
                ))}
              </ul>
            ) : (
              <div className="mt-4 panel-lux rounded-xl p-10 text-center text-cream-200">No watches match these filters.</div>
            )}

            {pages > 1 && (
              <nav className="mt-8 flex items-center justify-between text-sm" aria-label="Pages">
                {page > 1 ? (
                  <Link href={hrefWith(searchParams, { page: String(page - 1) })} className="text-gold-400 hover:text-gold-300">
                    ← Previous
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-cream-400 tabular-nums">
                  Page {page} of {pages}
                </span>
                {page < pages ? (
                  <Link href={hrefWith(searchParams, { page: String(page + 1) })} className="text-gold-400 hover:text-gold-300">
                    Next →
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </div>

          {/* Rankings */}
          <aside className="lg:col-span-4 space-y-6">
            <RankingPanel
              title="Longest on the market"
              explainer="Listings that have waited longest for a buyer. A “+” means it was already listed when tracking began."
              empty="Nothing listed yet."
              items={rankings.longest.map((l) => ({
                key: l.id,
                title: `${l.model ?? l.brand} ${l.reference ?? ""}`.trim(),
                subtitle: `${sourceNames[l.source_id] ?? l.source_id} · ${formatUsd(l.price_cents)}`,
                value: `${daysOnMarketLabel(l)} d`,
                href: l.reference_key ? `/market/${referenceSlug(l.brand, l.reference_key)}` : undefined,
              }))}
            />
            <RankingPanel
              title="Biggest price cuts"
              explainer="Active listings whose asking price has dropped the most since we first saw them."
              empty="No price cuts recorded yet. They show up as sellers reprice."
              items={rankings.priceCuts.map((l) => ({
                key: l.id,
                title: `${l.model ?? l.brand} ${l.reference ?? ""}`.trim(),
                subtitle: `${formatUsd(l.first_price_cents)} → ${formatUsd(l.price_cents)}`,
                value: formatPct(pctChange(l.first_price_cents, l.price_cents)),
                href: l.reference_key ? `/market/${referenceSlug(l.brand, l.reference_key)}` : undefined,
              }))}
            />
            <RankingPanel
              title="Quickest to leave"
              explainer="References whose listings disappear fastest (median days, at least three exits watched from start to finish)."
              empty="This ranking builds as listings we watched from day one leave the market, usually within a few weeks."
              items={rankings.quickest.map((r) => ({
                key: `${r.brand}-${r.reference_key}`,
                title: `${r.model ?? r.brand} ${r.reference ?? r.reference_key}`,
                subtitle: `${r.observed_exits} exits · ${r.active_count} listed now`,
                value: `${Math.round(r.median_days_to_leave ?? 0)} d`,
                href: `/market/${referenceSlug(r.brand, r.reference_key)}`,
              }))}
            />
            <RankingPanel
              title="Most listed references"
              explainer="Where supply is deepest right now, with the median asking price."
              empty="Nothing listed yet."
              items={rankings.mostSupplied.map((r) => ({
                key: `${r.brand}-${r.reference_key}`,
                title: `${r.model ?? r.brand} ${r.reference ?? r.reference_key}`,
                subtitle: `${formatUsd(r.min_cents, { compact: true })} – ${formatUsd(r.max_cents, { compact: true })}`,
                value: `${r.active_count}`,
                valueNote: `median ${formatUsd(r.median_cents, { compact: true })}`,
                href: `/market/${referenceSlug(r.brand, r.reference_key)}`,
              }))}
            />
            <p className="text-xs text-cream-400 leading-relaxed">
              Asking prices, not sale prices. “Left the market” means a listing came down; it may have sold or been withdrawn.{" "}
              <Link href="/market/about" className="text-gold-400 hover:text-gold-300">
                How this works
              </Link>
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}

function ComingSoon() {
  return (
    <>
      <PageHero
        eyebrow="Coming Soon"
        title="Market Tracker"
        subtitle="Pre-owned asking prices and time on market, collected every day from public retailer listings and the RIHOSO Watch Exchange."
      />
      <section className="py-16 bg-forest-800">
        <div className="max-w-xl mx-auto px-4 text-center text-cream-200">
          <p>Tracking starts with the first daily collection. Check back tomorrow.</p>
          <Link href="/market/about" className="inline-block mt-4 text-gold-400 hover:text-gold-300">
            How the tracker works →
          </Link>
        </div>
      </section>
    </>
  );
}
