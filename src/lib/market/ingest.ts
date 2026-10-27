import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { referenceKey } from "./format";
import type { SourceSnapshot } from "./types";

/**
 * A listing is only marked "left the market" when this run saw nearly everything the source
 * says it has. A partial or failed fetch must never look like a wave of sales.
 */
export const MIN_COVERAGE_FOR_EXITS = 0.97;

type Existing = {
  id: string;
  external_id: string;
  price_cents: number | null;
  first_price_cents: number | null;
  price_changes: number;
  status: "active" | "gone";
  first_seen_at: string;
  seen_at_launch: boolean;
};

export type IngestResult = {
  sourceId: string;
  expected: number | null;
  seen: number;
  added: number;
  gone: number;
  priceChanges: number;
  coverage: number | null;
  exitsApplied: boolean;
  notes: string[];
};

const chunk = <T,>(arr: T[], n: number) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

export async function ingestSnapshot(admin: SupabaseClient, snap: SourceSnapshot, now = new Date()): Promise<IngestResult> {
  const nowIso = now.toISOString();
  const notes = [...snap.notes];

  const existing = new Map<string, Existing>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from("market_listings")
      .select("id, external_id, price_cents, first_price_cents, price_changes, status, first_seen_at, seen_at_launch")
      .eq("source_id", snap.sourceId)
      .range(from, from + 999);
    if (error) throw new Error(`read existing listings: ${error.message}`);
    for (const row of (data ?? []) as Existing[]) existing.set(row.external_id, row);
    if (!data || data.length < 1000) break;
  }
  const firstRun = existing.size === 0;

  const seenIds = new Set(snap.listings.map((l) => l.externalId));
  const coverage = snap.expected ? Math.min(1, seenIds.size / snap.expected) : snap.listings.length ? 1 : null;
  const exitsApplied = coverage !== null && coverage >= MIN_COVERAGE_FOR_EXITS;
  if (!exitsApplied) notes.push(`coverage ${coverage == null ? "unknown" : (coverage * 100).toFixed(1) + "%"}: exits not recorded this run`);

  const upserts: Record<string, unknown>[] = [];
  const priceEvents: { external_id: string; price_cents: number; previous_cents: number | null }[] = [];
  const closeNow: { id: string; outcome: "sold" | "removed" | null }[] = [];
  let added = 0;
  let priceChanges = 0;

  for (const l of snap.listings) {
    const prev = existing.get(l.externalId);
    const fields = {
      source_id: snap.sourceId,
      external_id: l.externalId,
      url: l.url,
      brand: l.brand,
      model: l.model,
      reference: l.reference,
      reference_key: referenceKey(l.reference),
      year: l.year,
      dial: l.dial,
      case_material: l.caseMaterial,
      case_size_mm: l.caseSizeMm,
      bracelet: l.bracelet,
      has_box: l.hasBox,
      has_papers: l.hasPapers,
      certified: l.certified,
      currency: l.currency,
      price_cents: l.priceCents,
      last_seen_at: nowIso,
      updated_at: nowIso,
    };

    if (l.closed) {
      // Still on the source but no longer for sale (e.g. sold on the Watch Exchange).
      if (prev && prev.status === "active") closeNow.push({ id: prev.id, outcome: l.outcome ?? null });
      continue; // never start tracking a listing we only ever saw closed
    }

    if (!prev) {
      added++;
      upserts.push({
        ...fields,
        first_price_cents: l.priceCents,
        price_changes: 0,
        status: "active",
        outcome: null,
        gone_at: null,
        first_seen_at: l.listedAt ?? nowIso,
        // already up when we started tracking this source: its true age is unknown
        seen_at_launch: !l.listedAt && firstRun,
      });
      if (l.priceCents != null) priceEvents.push({ external_id: l.externalId, price_cents: l.priceCents, previous_cents: null });
      continue;
    }

    const changed = l.priceCents != null && prev.price_cents != null && l.priceCents !== prev.price_cents;
    if (changed) {
      priceChanges++;
      priceEvents.push({ external_id: l.externalId, price_cents: l.priceCents as number, previous_cents: prev.price_cents });
    }
    upserts.push({
      ...fields,
      first_price_cents: prev.first_price_cents ?? l.priceCents,
      price_changes: prev.price_changes + (changed ? 1 : 0),
      // a listing that comes back is active again
      status: "active",
      outcome: null,
      gone_at: null,
      first_seen_at: prev.first_seen_at,
      seen_at_launch: prev.seen_at_launch,
    });
  }

  // Write listings and collect ids for the price history.
  const idByExternal = new Map<string, string>();
  for (const part of chunk(upserts, 500)) {
    const { data, error } = await admin
      .from("market_listings")
      .upsert(part, { onConflict: "source_id,external_id" })
      .select("id, external_id");
    if (error) throw new Error(`upsert listings: ${error.message}`);
    for (const row of data ?? []) idByExternal.set(row.external_id as string, row.id as string);
  }
  const events = priceEvents
    .map((e) => ({ listing_id: idByExternal.get(e.external_id), observed_at: nowIso, price_cents: e.price_cents, previous_cents: e.previous_cents }))
    .filter((e) => e.listing_id);
  for (const part of chunk(events, 500)) {
    const { error } = await admin.from("market_price_events").insert(part);
    if (error) throw new Error(`insert price events: ${error.message}`);
  }

  // Listings that disappeared.
  if (exitsApplied) {
    const knowsOutcome = snap.sourceId === "rihoso-exchange";
    for (const prev of Array.from(existing.values())) {
      if (prev.status === "active" && !seenIds.has(prev.external_id)) {
        closeNow.push({ id: prev.id, outcome: knowsOutcome ? "removed" : null });
      }
    }
  }
  for (const outcome of ["sold", "removed", null] as const) {
    const ids = closeNow.filter((c) => c.outcome === outcome).map((c) => c.id);
    for (const part of chunk(ids, 300)) {
      const { error } = await admin
        .from("market_listings")
        .update({ status: "gone", gone_at: nowIso, outcome, updated_at: nowIso })
        .in("id", part);
      if (error) throw new Error(`mark gone: ${error.message}`);
    }
  }

  return {
    sourceId: snap.sourceId,
    expected: snap.expected,
    seen: seenIds.size,
    added,
    gone: closeNow.length,
    priceChanges,
    coverage,
    exitsApplied,
    notes,
  };
}
