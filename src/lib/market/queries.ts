import "server-only";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/config";
import { DAY_MS } from "./format";
import { LISTING_COLUMNS, type MarketListingRow, type MarketSource, type ReferenceStats } from "./types";

// Read-only queries for the public Market Tracker pages. Everything here is public data,
// so a plain anonymous client is used (no visitor session needed, pages can be cached).

function db() {
  return createSupabase(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const marketAvailable = isSupabaseConfigured;

export const SORTS = {
  longest: { label: "Longest on market", column: "first_seen_at", ascending: true },
  newest: { label: "Newest listings", column: "first_seen_at", ascending: false },
  price_asc: { label: "Price: low to high", column: "price_cents", ascending: true },
  price_desc: { label: "Price: high to low", column: "price_cents", ascending: false },
  repriced: { label: "Most repriced", column: "price_changes", ascending: false },
} as const;
export type SortKey = keyof typeof SORTS;

export type ListingFilters = {
  q?: string;
  model?: string;
  source?: string;
  status?: "active" | "gone";
  sort?: SortKey;
  page?: number;
  minPrice?: number;
  maxPrice?: number;
};

export const PAGE_SIZE = 40;

const clean = (s: string) => s.replace(/[%_,()*\\]/g, " ").trim();

export async function getListings(f: ListingFilters) {
  const sort = SORTS[f.sort ?? "longest"] ?? SORTS.longest;
  const status = f.status ?? "active";
  const page = Math.max(1, f.page ?? 1);
  let query = db()
    .from("market_listings")
    .select(LISTING_COLUMNS, { count: "exact" })
    .eq("status", status)
    .order(status === "gone" && (f.sort ?? "longest") === "longest" ? "gone_at" : sort.column, {
      ascending: status === "gone" && (f.sort ?? "longest") === "longest" ? false : sort.ascending,
      nullsFirst: false,
    })
    .order("id")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (f.source) query = query.eq("source_id", f.source);
  if (f.model) query = query.eq("model", f.model);
  if (f.minPrice) query = query.gte("price_cents", f.minPrice * 100);
  if (f.maxPrice) query = query.lte("price_cents", f.maxPrice * 100);
  if (f.q) {
    const term = clean(f.q);
    const key = term.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (term) {
      const ors = [`model.ilike.%${term}%`, `brand.ilike.%${term}%`, `dial.ilike.%${term}%`, `case_material.ilike.%${term}%`];
      if (key.length >= 3) ors.push(`reference_key.ilike.%${key}%`);
      query = query.or(ors.join(","));
    }
  }
  const { data, count, error } = await query;
  if (error) throw error;
  return { listings: (data ?? []) as unknown as MarketListingRow[], total: count ?? 0, page };
}

export async function getOverview() {
  const client = db();
  const since7 = new Date(Date.now() - 7 * DAY_MS).toISOString();
  const [active, added, gone, sources, lastRun] = await Promise.all([
    client.from("market_listings").select("id", { count: "exact", head: true }).eq("status", "active"),
    client
      .from("market_listings")
      .select("id", { count: "exact", head: true })
      .gte("first_seen_at", since7)
      .eq("seen_at_launch", false),
    client.from("market_listings").select("id", { count: "exact", head: true }).eq("status", "gone").gte("gone_at", since7),
    client.from("market_sources").select("id, name, kind, website, enabled, terms_checked_on, terms_note").order("name"),
    client.from("market_listings").select("last_seen_at").order("last_seen_at", { ascending: false }).limit(1),
  ]);
  if (active.error) throw active.error;
  return {
    activeCount: active.count ?? 0,
    added7d: added.count ?? 0,
    gone7d: gone.count ?? 0,
    sources: (sources.data ?? []) as MarketSource[],
    updatedAt: (lastRun.data?.[0]?.last_seen_at as string | undefined) ?? null,
  };
}

export async function getTrackingStart() {
  const { data } = await db().from("market_listings").select("first_seen_at").eq("seen_at_launch", true).order("first_seen_at").limit(1);
  return (data?.[0]?.first_seen_at as string | undefined) ?? null;
}

export async function getModels() {
  const { data } = await db().from("market_reference_stats").select("model, active_count").gt("active_count", 0);
  const counts = new Map<string, number>();
  for (const r of data ?? []) {
    if (!r.model) continue;
    counts.set(r.model as string, (counts.get(r.model as string) ?? 0) + (r.active_count as number));
  }
  return Array.from(counts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([model, count]) => ({ model, count }));
}

export async function getRankings() {
  const client = db();
  const [longest, cuts, supplied, quickest] = await Promise.all([
    client.from("market_listings").select(LISTING_COLUMNS).eq("status", "active").order("first_seen_at").limit(6),
    client
      .from("market_listings")
      .select(LISTING_COLUMNS)
      .eq("status", "active")
      .gt("price_changes", 0)
      .order("updated_at", { ascending: false })
      .limit(200),
    client.from("market_reference_stats").select("*").gt("active_count", 0).order("active_count", { ascending: false }).limit(8),
    client
      .from("market_reference_stats")
      .select("*")
      .gte("observed_exits", 3)
      .order("median_days_to_leave", { ascending: true })
      .limit(8),
  ]);
  const priceCuts = ((cuts.data ?? []) as unknown as MarketListingRow[])
    .filter((l) => l.first_price_cents && l.price_cents && l.price_cents < l.first_price_cents)
    .sort((a, b) => (a.price_cents! / a.first_price_cents!) - (b.price_cents! / b.first_price_cents!))
    .slice(0, 6);
  return {
    longest: (longest.data ?? []) as unknown as MarketListingRow[],
    priceCuts,
    mostSupplied: (supplied.data ?? []) as ReferenceStats[],
    quickest: (quickest.data ?? []) as ReferenceStats[],
  };
}

export async function getReference(brand: string, key: string) {
  const client = db();
  const [stats, listings, daily] = await Promise.all([
    client.from("market_reference_stats").select("*").ilike("brand", brand).eq("reference_key", key).maybeSingle(),
    client
      .from("market_listings")
      .select(LISTING_COLUMNS)
      .ilike("brand", brand)
      .eq("reference_key", key)
      .order("status")
      .order("first_seen_at")
      .limit(200),
    client
      .from("market_reference_daily")
      .select("day, active_count, median_cents, min_cents, max_cents, added_count, gone_count")
      .ilike("brand", brand)
      .eq("reference_key", key)
      .order("day")
      .limit(730),
  ]);
  return {
    stats: (stats.data ?? null) as ReferenceStats | null,
    listings: (listings.data ?? []) as unknown as MarketListingRow[],
    daily: (daily.data ?? []) as {
      day: string;
      active_count: number;
      median_cents: number | null;
      min_cents: number | null;
      max_cents: number | null;
      added_count: number;
      gone_count: number;
    }[],
  };
}

export async function getSourceNames() {
  const { data } = await db().from("market_sources").select("id, name");
  return Object.fromEntries((data ?? []).map((s) => [s.id as string, s.name as string])) as Record<string, string>;
}
