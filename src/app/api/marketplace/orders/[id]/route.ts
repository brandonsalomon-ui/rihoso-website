import { NextResponse } from "next/server";
import { clean } from "@/lib/email";
import { AUTO_RELEASE_DAYS, UserError, getOrder, notifyOrderEvent, releaseOrder } from "@/lib/orders";
import { siteUrl } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Order actions:
 *  seller: "ship" (carrier + tracking), "delivered"
 *  buyer:  "confirm" (releases payment), "dispute" (holds payment, alerts RIHOSO)
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

  try {
    if (action === "ship" && isSeller && order.fulfillment === "ship" && order.status === "paid_held") {
      const carrier = clean(data.carrier, 40);
      const tracking = clean(data.tracking, 80);
      if (!carrier || tracking.length < 6) throw new UserError("Please enter the carrier and tracking number.");
      await admin
        .from("orders")
        .update({ status: "shipped", shipping_carrier: carrier, tracking_number: tracking, shipped_at: now.toISOString() })
        .eq("id", order.id);
      await notifyOrderEvent({ ...order, shipping_carrier: carrier, tracking_number: tracking }, "shipped", base);
    } else if (action === "delivered" && isSeller && order.status === "shipped") {
      const releaseAt = new Date(now.getTime() + AUTO_RELEASE_DAYS * 24 * 60 * 60 * 1000);
      await admin
        .from("orders")
        .update({ status: "delivered", delivered_at: now.toISOString(), auto_release_at: releaseAt.toISOString() })
        .eq("id", order.id);
      await notifyOrderEvent(order, "delivered", base);
    } else if (action === "confirm" && isBuyer && ["paid_held", "shipped", "delivered"].includes(order.status)) {
      await releaseOrder(order.id, base, "buyer_confirmed");
    } else if (action === "dispute" && isBuyer && ["paid_held", "shipped", "delivered"].includes(order.status)) {
      const reason = clean(data.reason, 4000);
      if (reason.length < 10) throw new UserError("Please describe what's wrong.");
      await admin
        .from("orders")
        .update({ status: "disputed", dispute_reason: reason, disputed_at: now.toISOString(), auto_release_at: null })
        .eq("id", order.id);
      await notifyOrderEvent(order, "disputed", base, reason);
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
