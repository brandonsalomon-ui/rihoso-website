import { NextResponse } from "next/server";
import { finalizeMembershipCheckout, runMembershipHousekeeping } from "@/lib/memberships";
import { addBusinessDays } from "@/lib/business-days";
import { finalizeCheckout, getOrder, notifyOrderEvent, refundOrder, releaseOrder } from "@/lib/orders";
import { PICKUP_DAYS, RETURN_REVIEW_BUSINESS_DAYS } from "@/lib/policies";
import { finalizeServiceCheckout } from "@/lib/services";
import { siteUrl } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Runs daily (Vercel Cron).
 *  1. Safety net: confirms any paid checkouts the webhook may have missed.
 *  2. Releases payment for orders whose 72-hour inspection (from verified receipt) passed without a problem.
 *  2a. Missed deadlines: tells buyers they can cancel late shipments; cancels and refunds pickups not done in 7 days.
 *  2b. Refunds approved returns 2 business days after verified delivery to the seller, unless the seller reported a problem.
 *  3. Membership renewal reminders, and ends the member fee rate when an online membership lapses.
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

  const { data: pendingServices } = await admin
    .from("service_requests")
    .select("id, stripe_checkout_session_id")
    .eq("status", "awaiting_payment")
    .not("stripe_checkout_session_id", "is", null)
    .limit(50);
  for (const row of pendingServices ?? []) {
    try {
      const req = await finalizeServiceCheckout(row.stripe_checkout_session_id as string, base);
      if (req && req.status === "paid") confirmed.push(row.id);
    } catch (err) {
      console.error("[cron] service finalize failed", row.id, err);
    }
  }

  const { data: pendingMemberships } = await admin
    .from("memberships")
    .select("id, stripe_checkout_session_id")
    .eq("status", "pending")
    .not("stripe_checkout_session_id", "is", null)
    .gte("created_at", new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
    .limit(50);
  for (const row of pendingMemberships ?? []) {
    try {
      const m = await finalizeMembershipCheckout(row.stripe_checkout_session_id as string, base);
      if (m && m.status === "paid") confirmed.push(row.id);
    } catch (err) {
      console.error("[cron] membership finalize failed", row.id, err);
    }
  }
  let membership: Awaited<ReturnType<typeof runMembershipHousekeeping>> | { error: string };
  try {
    membership = await runMembershipHousekeeping(base);
  } catch (err) {
    console.error("[cron] membership housekeeping failed", err);
    membership = { error: "failed" };
  }

  const nowIso = new Date().toISOString();
  const deadlines: Record<string, string> = {};

  // Shipping deadline passed: tell the buyer they may cancel (once).
  const { data: lateShips } = await admin
    .from("orders")
    .select("id")
    .eq("status", "paid_held")
    .eq("fulfillment", "ship")
    .lt("ship_by", nowIso)
    .is("ship_overdue_notified_at", null)
    .limit(50);
  for (const row of lateShips ?? []) {
    try {
      const order = await getOrder(row.id as string);
      if (!order) continue;
      await admin.from("orders").update({ ship_overdue_notified_at: nowIso }).eq("id", order.id);
      await notifyOrderEvent(order, "ship_overdue", base);
      deadlines[order.id] = "ship_overdue_notified";
    } catch (err) {
      console.error("[cron] ship overdue failed", row.id, err);
    }
  }

  // Pickup not done within 7 days and no handover recorded: cancel and refund.
  const { data: latePickups } = await admin
    .from("orders")
    .select("id")
    .eq("status", "paid_held")
    .eq("fulfillment", "pickup")
    .lt("pickup_deadline", nowIso)
    .is("handover_reported_at", null)
    .limit(50);
  for (const row of latePickups ?? []) {
    try {
      await refundOrder(row.id as string, base, `Cancelled automatically: pickup wasn't completed within ${PICKUP_DAYS} days of payment.`, {
        outcome: "cancelled",
        buyerText: `Pickup wasn't completed within ${PICKUP_DAYS} days, so the order was cancelled and your payment refunded in full. It usually appears on your card within 5–10 business days.`,
        sellerText: `Pickup wasn't completed within ${PICKUP_DAYS} days of payment, so the order was cancelled and the buyer refunded. Please don't hand over the watch for this order.`,
      });
      deadlines[row.id as string] = "pickup_cancelled";
    } catch (err) {
      console.error("[cron] pickup cancel failed", row.id, err);
    }
  }

  // Approved returns delivered to the seller: refund after the seller's review window unless they reported a problem.
  const { data: returns } = await admin
    .from("orders")
    .select("id, return_received_at")
    .eq("status", "disputed")
    .not("return_received_at", "is", null)
    .is("return_problem_at", null)
    .limit(50);
  for (const row of returns ?? []) {
    try {
      const due = addBusinessDays(new Date(row.return_received_at as string), RETURN_REVIEW_BUSINESS_DAYS);
      if (due > new Date()) continue;
      await refundOrder(row.id as string, base, undefined, {
        buyerText: "Your return was delivered to the seller and the review period has passed, so RIHOSO refunded your payment in full. It usually appears on your card within 5–10 business days.",
        sellerText: `The returned watch was delivered to you ${RETURN_REVIEW_BUSINESS_DAYS} business days ago with no problem reported, so the buyer has been refunded in full. No fee is charged on this sale.`,
      });
      deadlines[row.id as string] = "return_refunded";
    } catch (err) {
      console.error("[cron] return refund failed", row.id, err);
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
  return NextResponse.json({ ok: true, confirmed, deadlines, results, membership });
}
