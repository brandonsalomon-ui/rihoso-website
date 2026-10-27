// Shared types for the RIHOSO Market Tracker.

/** One listing as a source reports it, normalized. */
export type SourceListing = {
  externalId: string;
  url: string | null;
  brand: string;
  model: string | null;
  reference: string | null;
  year: number | null;
  dial: string | null;
  caseMaterial: string | null;
  caseSizeMm: number | null;
  bracelet: string | null;
  hasBox: boolean | null;
  hasPapers: boolean | null;
  certified: boolean;
  currency: string;
  priceCents: number | null;
  /** Only sources that know the outcome set this (the RIHOSO Watch Exchange). */
  outcome?: "sold" | "removed" | null;
  /** True when the source still shows the listing but it is no longer for sale. */
  closed?: boolean;
  /** When the source says the listing went up, if it says (gives a true first-seen date). */
  listedAt?: string | null;
};

/** What a source collector returns for one run. */
export type SourceSnapshot = {
  sourceId: string;
  listings: SourceListing[];
  /** How many listings the source says it has; null when it doesn't say. */
  expected: number | null;
  requests: number;
  notes: string[];
};

export type MarketListingRow = {
  id: string;
  source_id: string;
  external_id: string;
  url: string | null;
  brand: string;
  model: string | null;
  reference: string | null;
  reference_key: string | null;
  year: number | null;
  dial: string | null;
  case_material: string | null;
  case_size_mm: number | null;
  bracelet: string | null;
  has_box: boolean | null;
  has_papers: boolean | null;
  certified: boolean;
  currency: string;
  price_cents: number | null;
  first_price_cents: number | null;
  price_changes: number;
  status: "active" | "gone";
  outcome: "sold" | "removed" | null;
  seen_at_launch: boolean;
  first_seen_at: string;
  last_seen_at: string;
  gone_at: string | null;
};

export type ReferenceStats = {
  brand: string;
  reference_key: string;
  reference: string | null;
  model: string | null;
  active_count: number;
  median_cents: number | null;
  min_cents: number | null;
  max_cents: number | null;
  median_age_days: number | null;
  gone_30d: number;
  added_30d: number;
  median_days_to_leave: number | null;
  observed_exits: number;
  repriced_count: number;
  source_count: number;
};

export type MarketSource = {
  id: string;
  name: string;
  kind: string;
  website: string | null;
  enabled: boolean;
  terms_checked_on: string | null;
  terms_note: string | null;
};

export const LISTING_COLUMNS =
  "id, source_id, external_id, url, brand, model, reference, reference_key, year, dial, case_material, case_size_mm, bracelet, has_box, has_papers, certified, currency, price_cents, first_price_cents, price_changes, status, outcome, seen_at_launch, first_seen_at, last_seen_at, gone_at";
