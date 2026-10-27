// Small formatting and normalization helpers for the Market Tracker (safe on server and client).

/** Grouping key for a reference: "126610 LN" and "126610-LN" both become "126610LN". */
export function referenceKey(ref: string | null | undefined): string | null {
  if (!ref) return null;
  const key = ref.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return key.length >= 3 ? key : null;
}

export function formatUsd(cents: number | null | undefined, opts: { compact?: boolean } = {}) {
  if (cents == null) return "—";
  const dollars = cents / 100;
  if (opts.compact && dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(dollars >= 100000 ? 0 : 1).replace(/\.0$/, "")}K`;
  }
  return dollars.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export const DAY_MS = 24 * 60 * 60 * 1000;

export function daysBetween(from: string | Date, to: string | Date = new Date()) {
  return Math.max(0, Math.floor((new Date(to).getTime() - new Date(from).getTime()) / DAY_MS));
}

/**
 * Days on market for display. Listings that were already up when tracking began only have a
 * lower bound, so they show as "42+".
 */
export function daysOnMarketLabel(l: { first_seen_at: string; gone_at: string | null; seen_at_launch: boolean }) {
  const d = daysBetween(l.first_seen_at, l.gone_at ?? new Date());
  return l.seen_at_launch ? `${d}+` : String(d);
}

export function pctChange(from: number | null | undefined, to: number | null | undefined) {
  if (!from || to == null) return null;
  return ((to - from) / from) * 100;
}

export function formatPct(p: number | null, digits = 1) {
  if (p == null || !Number.isFinite(p)) return "—";
  const s = p.toFixed(digits);
  return `${p > 0 ? "+" : ""}${s}%`;
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" });
}

export function referenceSlug(brand: string, key: string) {
  return `${encodeURIComponent(brand.toLowerCase().replace(/\s+/g, "-"))}/${encodeURIComponent(key)}`;
}
