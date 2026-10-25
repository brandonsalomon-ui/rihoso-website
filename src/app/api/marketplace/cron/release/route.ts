import { NextResponse } from "next/server";
import { releaseOrder } from "@/lib/orders";
import { siteUrl } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Runs daily (Vercel Cron). Releases payment for delivered orders whose
 * 3-day problem window has passed without a dispute.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data } = await createAdminClient()
    .from("orders")
    .select("id")
    .eq("status", "delivered")
    .lte("auto_release_at", new Date().toISOString())
    .limit(50);
  const results: Record<string, string> = {};
  for (const row of data ?? []) {
    try {
      await releaseOrder(row.id, siteUrl(request), "auto");
      results[row.id] = "released";
    } catch (err) {
      console.error("[cron] release failed", row.id, err);
      results[row.id] = "failed";
    }
  }
  return NextResponse.json({ ok: true, results });
}
