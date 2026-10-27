import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SourceListing, SourceSnapshot } from "../types";

// RIHOSO's own Watch Exchange. Unlike retailer sources, we know when a watch actually sold.

export const RIHOSO_SOURCE_ID = "rihoso-exchange";

export async function collectRihosoExchange(admin: SupabaseClient, siteUrl: string): Promise<SourceSnapshot> {
  const { data, error } = await admin
    .from("listings")
    .select("id, brand, model, reference, year, has_box, has_papers, price_cents, status, published_at")
    .in("status", ["active", "reserved", "sold"])
    .limit(5000);
  if (error) throw new Error(`Watch Exchange read failed: ${error.message}`);
  const listings: SourceListing[] = (data ?? []).map((l) => ({
    externalId: l.id as string,
    url: `${siteUrl}/marketplace/listings/${l.id}`,
    brand: (l.brand as string).trim(),
    model: (l.model as string | null)?.trim() || null,
    reference: (l.reference as string | null)?.trim() || null,
    year: (l.year as number | null) ?? null,
    dial: null,
    caseMaterial: null,
    caseSizeMm: null,
    bracelet: null,
    hasBox: l.has_box as boolean,
    hasPapers: l.has_papers as boolean,
    certified: false,
    currency: "USD",
    priceCents: l.price_cents as number,
    closed: l.status === "sold",
    outcome: l.status === "sold" ? "sold" : null,
    listedAt: (l.published_at as string | null) ?? null,
  }));
  return { sourceId: RIHOSO_SOURCE_ID, listings, expected: listings.length, requests: 0, notes: [] };
}
