import { NextResponse } from "next/server";
import { ingestSnapshot, type IngestResult } from "@/lib/market/ingest";
import { collectBucherer, BUCHERER_SOURCE_ID } from "@/lib/market/sources/bucherer";
import { collectRihosoExchange, RIHOSO_SOURCE_ID } from "@/lib/market/sources/rihoso";
import type { SourceSnapshot } from "@/lib/market/types";
import { siteUrl } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Runs daily (Vercel Cron): collects every enabled market source, records what changed,
 * then writes the day's per-reference snapshot. Each source is independent — one failing
 * never stops the others.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const base = siteUrl(request);

  const { data: sources, error } = await admin.from("market_sources").select("id").eq("enabled", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const enabled = new Set((sources ?? []).map((s) => s.id as string));

  const collectors: Record<string, () => Promise<SourceSnapshot>> = {
    [BUCHERER_SOURCE_ID]: () => collectBucherer(),
    [RIHOSO_SOURCE_ID]: () => collectRihosoExchange(admin, base),
  };

  const results: (IngestResult | { sourceId: string; error: string })[] = [];
  for (const [sourceId, collect] of Object.entries(collectors)) {
    if (!enabled.has(sourceId)) continue;
    const { data: run } = await admin.from("market_runs").insert({ source_id: sourceId }).select("id").single();
    try {
      const snap = await collect();
      const result = await ingestSnapshot(admin, snap);
      results.push(result);
      if (run) {
        await admin
          .from("market_runs")
          .update({
            finished_at: new Date().toISOString(),
            ok: true,
            expected: result.expected,
            seen: result.seen,
            added: result.added,
            gone: result.gone,
            price_changes: result.priceChanges,
            coverage: result.coverage,
            requests: snap.requests,
            error: result.notes.length ? result.notes.join(" | ").slice(0, 2000) : null,
          })
          .eq("id", run.id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[market] collect failed", sourceId, err);
      results.push({ sourceId, error: message });
      if (run) {
        await admin
          .from("market_runs")
          .update({ finished_at: new Date().toISOString(), ok: false, error: message.slice(0, 2000) })
          .eq("id", run.id);
      }
    }
  }

  const { data: snapshotRows, error: snapErr } = await admin.rpc("market_take_snapshot");
  return NextResponse.json({ ok: true, results, snapshot: snapErr ? snapErr.message : snapshotRows });
}
