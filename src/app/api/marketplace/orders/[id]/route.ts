import { NextResponse } from "next/server";
import { clean, sendNotification } from "@/lib/email";
import { UserError, getOrder, notifyOrderEvent, refundOrder, releaseOrder, verifyReceipt } from "@/lib/orders";
import { siteUrl } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Order actions.
 *  seller: "ship" (carrier + tracking), "report_delivery" (ship), "report_handover" (pickup),
 *          "return_received" (approved return arrived fine), "return_problem" (arrived with a specific problem)
 *  buyer:  "received" (verified receipt / collection → 72-hour inspection starts), "accept" (releases payment),
 *          "dispute" (holds payment), "cancel_overdue" (seller missed the shipping deadline → full refund),
 *          "return_shipped" (return tracking)
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { user } = await getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const order = await getOrder(params.id);
  if (!order || (order.buyer_id !== user.id && order.seller_id !== user.id)) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const action = String(data.action ?? "");
  const isSeller = user.id === order.seller_id;
  const isBuyer = user.id === order.buyer_id;
  const base = siteUrl(request);
  const admin = createAdminClient();
  const now = new Date();
  const ship = order.fulfillment === "ship";

  try {
    if (action === "ship" && isSeller && ship && order.status === "paid_held") {
      const carrier = clean(data.carrier, 40);
      const tracking = clean(data.tracking, 80);
      if (!carrier || tracking.length < 6) throw new UserError("Please enter the carrier and tracking number.");
      await admin
        .from("orders")
        .update({ status: "shipped", shipping_carrier: carrier, tracking_number: tracking, shipped_at: now.toISOString() })
        .eq("id", order.id)
        .eq("status", "paid_held");
      await notifyOrderEvent({ ...order, shipping_carrier: carrier, tracking_number: tracking }, "shipped", base);
    } else if (action === "report_delivery" && isSeller && ship && order.status === "shipped") {
      // The seller's report doesn't start the inspection clock; the buyer or RIHOSO verifies receipt.
      await admin.from("orders").update({ delivery_reported_at: now.toISOString() }).eq("id", order.id);
      await notifyOrderEvent(order, "delivery_reported", base);
      await sendNotification({
        subject: "Delivery to verify on the Watch Exchange",
        rows: [
          ["Order", `${base}/marketplace/orders/${order.id}`],
          ["Tracking", `${order.shipping_carrier ?? ""} ${order.tracking_number ?? ""}`],
          ["Verify", `${base}/marketplace/admin`],
        ],
      }).catch(() => {});
    } else if (action === "report_handover" && isSeller && !ship && order.status === "paid_held") {
      await admin.from("orders").update({ handover_reported_at: now.toISOString() }).eq("id", order.id);
      await notifyOrderEvent(order, "handover_reported", base);
    } else if (action === "received" && isBuyer && (ship ? order.status === "shipped" : order.status === "paid_held")) {
      await verifyReceipt(order.id, "buyer", base);
    } else if (action === "accept" && isBuyer) {
      // Accepting after receipt releases payment; for shipping, accepting while in transit also confirms receipt.
      await releaseOrder(order.id, base, "buyer_confirmed");
    } else if (action === "dispute" && isBuyer && ["paid_held", "shipped", "delivered"].includes(order.status)) {
      const reason = clean(data.reason, 4000);
      if (reason.length < 10) throw new UserError("Please describe what's wrong.");
      await admin
        .from("orders")
        .update({ status: "disputed", dispute_reason: reason, disputed_at: now.toISOString(), auto_release_at: null })
        .eq("id", order.id);
      await notifyOrderEvent(order, "disputed", base, reason);
    } else if (action === "cancel_overdue" && isBuyer && ship && order.status === "paid_held") {
      if (!order.ship_by || new Date(order.ship_by) > now) throw new UserError("The shipping deadline hasn't passed yet.");
      await refundOrder(order.id, base, "Cancelled by the buyer: the seller didn't ship within 3 business days.", {
        outcome: "cancelled",
        sellerText: "The buyer cancelled this order because it wasn't shipped within 3 business days, and was refunded in full. Please don't ship the watch.",
      });
    } else if (action === "return_shipped" && isBuyer && order.status === "disputed" && order.return_approved_at) {
      const carrier = clean(data.carrier, 40);
      const tracking = clean(data.tracking, 80);
      if (!carrier || tracking.length < 6) throw new UserError("Please enter the carrier and tracking number.");
      await admin
        .from("orders")
        .update({ return_carrier: carrier, return_tracking: tracking, return_shipped_at: now.toISOString() })
        .eq("id", order.id);
      await sendNotification({
        subject: "Watch Exchange return shipped",
        rows: [
          ["Order", `${base}/marketplace/orders/${order.id}`],
          ["Return tracking", `${carrier} ${tracking}`],
        ],
      }).catch(() => {});
    } else if (action === "return_received" && isSeller && order.status === "disputed" && order.return_approved_at) {
      await admin.from("orders").update({ return_received_at: now.toISOString() }).eq("id", order.id);
      await refundOrder(order.id, base, order.decision_note ?? undefined, {
        buyerText: "The seller confirmed your return arrived, and RIHOSO has refunded your payment in full. It usually appears on your card within 5–10 business days.",
        sellerText: "Thanks for confirming the return. The buyer has been refunded in full; no fee is charged on this sale.",
      });
    } else if (action === "return_problem" && isSeller && order.status === "disputed" && order.return_approved_at) {
      const problem = clean(data.problem, 4000);
      if (problem.length < 10) throw new UserError("Please describe the specific problem with the returned watch.");
      await admin
        .from("orders")
        .update({ return_received_at: order.return_received_at ?? now.toISOString(), return_problem: problem, return_problem_at: now.toISOString() })
        .eq("id", order.id);
      await sendNotification({
        subject: "Returned watch: seller reports a problem",
        rows: [
          ["Order", `${base}/marketplace/orders/${order.id}`],
          ["Seller's report", problem],
        ],
      }).catch(() => {});
    } else {
      throw new UserError("That action isn't available for this order.");
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UserError) return NextResponse.json({ error: err.message }, { status: 409 });
    console.error("[orders] action failed", action, err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 502 });
  }
}
