import { NextResponse } from "next/server";
import { finalizeCheckout, releaseOrder } from "@/lib/orders";
import { siteUrl } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Runs daily (Vercel Cron).
 *  1. Safety net: confirms any paid checkouts the webhook may have missed.
 *  2. Releases payment for delivered orders whose 3-day problem window has passed without a dispute.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const base = siteUrl(request);
  const { data: pending } = await admin
    .from("orders")
    .select("id, stripe_checkout_session_id")
    .eq("status", "pending_payment")
    .not("stripe_checkout_session_id", "is", null)
    .gte("created_at", new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
    .limit(50);
  const confirmed: string[] = [];
  for (const row of pending ?? []) {
    try {
      const order = await finalizeCheckout(row.stripe_checkout_session_id as string, base);
      if (order && order.status !== "pending_payment") confirmed.push(row.id);
    } catch (err) {
      console.error("[cron] finalize failed", row.id, err);
    }
  }

  const { data } = await admin
    .from("orders")
    .select("id")
    .eq("status", "delivered")
    .lte("auto_release_at", new Date().toISOString())
    .limit(50);
  const results: Record<string, string> = {};
  for (const row of data ?? []) {
    try {
      await releaseOrder(row.id, base, "auto");
      results[row.id] = "released";
    } catch (err) {
      console.error("[cron] release failed", row.id, err);
      results[row.id] = "failed";
    }
  }
  return NextResponse.json({ ok: true, confirmed, results });
}
