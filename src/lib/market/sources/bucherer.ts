import "server-only";
import { isAllowed, loadRobots, MARKET_USER_AGENT } from "../robots";
import type { SourceListing, SourceSnapshot } from "../types";

// Tourneau | Bucherer (US) — Rolex Certified Pre-Owned selection.
// Their listing pages are server-rendered and carry the product data as JSON (#mobify-data),
// so we read the same pages a visitor sees: once a day, a handful of requests, paced, with an
// identifying user agent, and only paths their robots.txt allows. Photos are never copied.

export const BUCHERER_SOURCE_ID = "bucherer-us";
const ORIGIN = "https://www.bucherer.com";
const BASE_PATH = "/us/en/rolex-certified-pre-owned/watches";
const PAGE_LIMIT = 200; // the most one page will return
const PACE_MS = 2500; // pause between requests
const MAX_REQUESTS = 40; // hard ceiling per run
// Without a browser session the site returns every country's selection; this limits it to the US one.
const US_ONLY = "c_att_Customer_groups_Per_Country_vis_online=US Everyone";

type Hit = {
  productId?: string;
  price?: number;
  currency?: string;
  c_available?: boolean;
  c_online_availability?: string;
  c_urlPath?: string;
  c_en_urlPath?: string;
  c_brand?: string;
  c_att_Line?: string;
  c_productNameCpo?: string;
  c_productReference?: string;
  c_att_Supplier_Reference?: string;
  c_isCPO?: boolean;
  c_att_Case_Material?: string;
  representedProduct?: Record<string, unknown>;
};

type PageResult = { total: number; hits: Hit[] };

/** Pulls the product-search result out of a listing page's embedded JSON. */
export function parseListingPage(html: string): PageResult | null {
  const m = html.match(/<script[^>]*id="mobify-data"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  let data: unknown;
  try {
    data = JSON.parse(m[1]);
  } catch {
    return null;
  }
  const queries = (data as { __PRELOADED_STATE__?: { __reactQuery?: { queries?: unknown[] } } })?.__PRELOADED_STATE__
    ?.__reactQuery?.queries;
  if (!Array.isArray(queries)) return null;
  for (const q of queries as { queryKey?: unknown[]; state?: { data?: { total?: number; hits?: Hit[] } } }[]) {
    if (!Array.isArray(q.queryKey) || !q.queryKey.includes("/product-search")) continue;
    const d = q.state?.data;
    if (d && Array.isArray(d.hits) && typeof d.total === "number") return { total: d.total, hits: d.hits };
  }
  return null;
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const first = (v: unknown) => (Array.isArray(v) ? str(v[0]) : str(v));

export function normalizeHit(hit: Hit): SourceListing | null {
  if (!hit.productId) return null;
  const rp = hit.representedProduct ?? {};
  const path = hit.c_en_urlPath ?? hit.c_urlPath ?? null;
  const yearRaw = str(rp.c_att_CPO_Year_of_Made) ?? str(rp.c_att_CPO_Year_Formula_for_Rolex_Label);
  const year = yearRaw && /^\d{4}$/.test(yearRaw) ? Number(yearRaw) : null;
  const size = typeof rp.c_att_Case_Diameter_raw === "number" ? rp.c_att_Case_Diameter_raw : null;
  const attachments = Array.isArray(rp.c_att_CPO_Attachments) ? (rp.c_att_CPO_Attachments as string[]).map((a) => a.toLowerCase()) : [];
  const available = hit.c_available !== false && hit.c_online_availability !== "unavailable";
  return {
    externalId: hit.productId,
    url: path ? `${ORIGIN}${path}` : null,
    brand: str(hit.c_brand) ?? "Rolex",
    model: str(hit.c_att_Line) ?? str(hit.c_productNameCpo),
    reference: str(hit.c_productReference) ?? str(hit.c_att_Supplier_Reference) ?? str(rp.c_att_CPO_Reference),
    year,
    dial: str(rp.c_att_Dial_Colour),
    caseMaterial: first(rp.c_att_Case_Material) ?? str(hit.c_att_Case_Material),
    caseSizeMm: size,
    bracelet: str(rp.c_att_Strap_Typ),
    hasBox: attachments.length ? attachments.some((a) => a.includes("box")) : null,
    hasPapers: attachments.length ? attachments.some((a) => a.includes("guarantee") || a.includes("papers")) : null,
    certified: hit.c_isCPO !== false,
    currency: str(hit.currency) ?? "USD",
    priceCents: typeof hit.price === "number" ? Math.round(hit.price * 100) : null,
    closed: !available,
  };
}

function isUsListing(hit: Hit) {
  const groups = hit.representedProduct?.c_att_Customer_groups_Per_Country_vis_online;
  return !Array.isArray(groups) || groups.includes("US Everyone");
}

/** The collection slug in a product path: /watches/{slug}/{id}.html */
function lineSlug(hit: Hit) {
  const path = hit.c_en_urlPath ?? hit.c_urlPath ?? "";
  const m = path.match(/\/rolex-certified-pre-owned\/watches\/([a-z0-9-]+)\/[^/]+\.html$/);
  return m ? m[1] : null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function collectBucherer(): Promise<SourceSnapshot> {
  const rules = await loadRobots(ORIGIN);
  const notes: string[] = [];
  let requests = 0;

  async function page(path: string, sort: string): Promise<PageResult | null> {
    const pathWithQuery = `${path}?limit=${PAGE_LIMIT}&sort=${sort}&refine=${encodeURIComponent(US_ONLY)}`;
    if (!isAllowed(rules, pathWithQuery)) {
      notes.push(`skipped (robots.txt): ${pathWithQuery}`);
      return null;
    }
    if (requests >= MAX_REQUESTS) {
      notes.push(`request ceiling reached before ${pathWithQuery}`);
      return null;
    }
    if (requests > 0) await sleep(PACE_MS);
    requests++;
    const res = await fetch(`${ORIGIN}${pathWithQuery}`, {
      headers: { "user-agent": MARKET_USER_AGENT, accept: "text/html", "accept-language": "en-US" },
      cache: "no-store",
    });
    if (!res.ok) {
      notes.push(`${res.status} on ${pathWithQuery}`);
      return null;
    }
    const parsed = parseListingPage(await res.text());
    if (!parsed) notes.push(`no listing data on ${pathWithQuery}`);
    return parsed;
  }

  const byId = new Map<string, Hit>();
  const slugs = new Set<string>();
  const visited = new Set<string>();
  const add = (r: PageResult | null) => {
    for (const h of r?.hits ?? []) {
      if (!h.productId || !isUsListing(h)) continue;
      byId.set(h.productId, h);
      const s = lineSlug(h);
      if (s) slugs.add(s);
    }
  };

  // 1. The full selection, three orderings (each page returns at most 200).
  let expected: number | null = null;
  for (const sort of ["Novelties", "price-low-to-high", "price-high-to-low"]) {
    const r = await page(BASE_PATH, sort);
    if (r) expected = r.total;
    add(r);
    if (r && r.total <= PAGE_LIMIT) break;
  }

  // 2. Each collection page, in both price orders when it holds more than one page.
  //    Repeat while new collections keep turning up.
  for (let round = 0; round < 3; round++) {
    const pending = Array.from(slugs).filter((s) => !visited.has(s));
    if (!pending.length) break;
    for (const slug of pending) {
      visited.add(slug);
      const low = await page(`${BASE_PATH}/${slug}`, "price-low-to-high");
      add(low);
      if (low && low.total > PAGE_LIMIT) add(await page(`${BASE_PATH}/${slug}`, "price-high-to-low"));
      if (low && low.total > PAGE_LIMIT * 2) notes.push(`${slug}: ${low.total} listings, more than two pages can cover`);
    }
  }

  const listings = Array.from(byId.values())
    .map(normalizeHit)
    .filter((l): l is SourceListing => l !== null);
  return { sourceId: BUCHERER_SOURCE_ID, listings, expected, requests, notes };
}
