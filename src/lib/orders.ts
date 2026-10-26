import "server-only";
import type Stripe from "stripe";
import { sendMemberEmail, sendNotification } from "@/lib/email";
import { commissionCents, formatUsd } from "@/lib/marketplace";
import { getStripe, siteUrl } from "@/lib/stripe";
import { createAdminClient, getUserEmail } from "@/lib/supabase/admin";

/** Days after delivery before held money is released automatically (unless a problem is reported). */
export const AUTO_RELEASE_DAYS = 3;

export type OrderStatus =
  | "pending_payment"
  | "paid_held"
  | "shipped"
  | "delivered"
  | "released"
  | "disputed"
  | "refunded"
  | "cancelled";

export type OrderRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  offer_id: string | null;
  conversation_id: string | null;
  amount_cents: number;
  commission_cents: number;
  seller_payout_cents: number | null;
  status: OrderStatus;
  fulfillment: "ship" | "pickup";
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  stripe_transfer_id: string | null;
  shipping_name: string | null;
  shipping_address: Record<string, string | null> | null;
  shipping_carrier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  auto_release_at: string | null;
  released_at: string | null;
  dispute_reason: string | null;
  disputed_at: string | null;
  created_at: string;
};

const ORDER_COLUMNS =
  "id, listing_id, buyer_id, seller_id, offer_id, conversation_id, amount_cents, commission_cents, seller_payout_cents, status, fulfillment, stripe_checkout_session_id, stripe_payment_intent_id, stripe_charge_id, stripe_transfer_id, shipping_name, shipping_address, shipping_carrier, tracking_number, shipped_at, delivered_at, auto_release_at, released_at, dispute_reason, disputed_at, created_at";

export async function getOrder(id: string) {
  const { data } = await createAdminClient().from("orders").select(ORDER_COLUMNS).eq("id", id).maybeSingle();
  return (data as OrderRow | null) ?? null;
}

async function listingTitle(listingId: string) {
  const { data } = await createAdminClient().from("listings").select("title").eq("id", listingId).maybeSingle();
  return data?.title ?? "your watch";
}

async function notify(userId: string, subject: string, intro: string, orderId: string, base: string, quote?: string) {
  try {
    const to = await getUserEmail(userId);
    if (to) {
      await sendMemberEmail({ to, subject, intro, quote, ctaLabel: "View order on RIHOSO", ctaUrl: `${base}/marketplace/orders/${orderId}` });
    }
  } catch (err) {
    console.error("[orders] notification failed", err);
  }
}

/**
 * Creates a pending order and a Stripe Checkout session for an open offer.
 * The money is charged to RIHOSO's Stripe account and held there (separate charges
 * and transfers) until it is released to the seller.
 */
export async function startCheckout({
  offerId,
  buyerId,
  fulfillment,
  request,
}: {
  offerId: string;
  buyerId: string;
  fulfillment: "ship" | "pickup";
  request: Request;
}) {
  const admin = createAdminClient();
  const { data: offer } = await admin
    .from("offers")
    .select("id, listing_id, conversation_id, buyer_id, seller_id, amount_cents, allows_shipping, allows_pickup, status, expires_at")
    .eq("id", offerId)
    .maybeSingle();
  if (!offer || offer.buyer_id !== buyerId) throw new UserError("Offer not found.");
  if (offer.status !== "open" || new Date(offer.expires_at) < new Date()) throw new UserError("This offer is no longer open.");
  if (fulfillment === "ship" && !offer.allows_shipping) throw new UserError("The seller didn't offer shipping for this sale.");
  if (fulfillment === "pickup" && !offer.allows_pickup) throw new UserError("The seller didn't offer local pickup for this sale.");

  const [{ data: listing }, { data: sellerProfile }, { data: seller }] = await Promise.all([
    admin.from("listings").select("id, title, status").eq("id", offer.listing_id).maybeSingle(),
    admin.from("profiles").select("is_member").eq("id", offer.seller_id).maybeSingle(),
    admin.from("seller_accounts").select("stripe_account_id, payouts_enabled").eq("user_id", offer.seller_id).maybeSingle(),
  ]);
  if (!listing || !["active", "reserved"].includes(listing.status)) throw new UserError("This watch is no longer available.");
  if (!seller?.payouts_enabled) throw new UserError("The seller can't accept payments yet.");

  const commission = commissionCents(offer.amount_cents, Boolean(sellerProfile?.is_member));

  // Reuse an unpaid order for the same offer if the buyer comes back.
  const { data: existing } = await admin
    .from("orders")
    .select("id")
    .eq("offer_id", offer.id)
    .eq("status", "pending_payment")
    .maybeSingle();

  let orderId = existing?.id as string | undefined;
  if (orderId) {
    await admin.from("orders").update({ fulfillment, amount_cents: offer.amount_cents, commission_cents: commission }).eq("id", orderId);
  } else {
    const { data: created, error } = await admin
      .from("orders")
      .insert({
        listing_id: offer.listing_id,
        buyer_id: offer.buyer_id,
        seller_id: offer.seller_id,
        offer_id: offer.id,
        conversation_id: offer.conversation_id,
        amount_cents: offer.amount_cents,
        commission_cents: commission,
        fulfillment,
      })
      .select("id")
      .single();
    if (error || !created) throw error ?? new Error("Couldn't create order");
    orderId = created.id as string;
  }

  const buyerEmail = await getUserEmail(buyerId);
  const base = siteUrl(request);
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: buyerEmail ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: offer.amount_cents,
          product_data: {
            name: listing.title,
            description:
              fulfillment === "ship"
                ? "Shipped fully insured with signature. Payment held by RIHOSO until you confirm delivery."
                : "Local pickup. Payment held by RIHOSO until you confirm you have the watch.",
          },
        },
      },
    ],
    shipping_address_collection: fulfillment === "ship" ? { allowed_countries: ["US"] } : undefined,
    phone_number_collection: { enabled: true },
    payment_intent_data: {
      transfer_group: `order_${orderId}`,
      description: `RIHOSO Watch Exchange — ${listing.title}`,
      metadata: { order_id: orderId, listing_id: listing.id },
    },
    metadata: { order_id: orderId, offer_id: offer.id },
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    success_url: `${base}/marketplace/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/marketplace/messages/${offer.conversation_id}`,
  });

  await admin.from("orders").update({ stripe_checkout_session_id: session.id }).eq("id", orderId);
  return { url: session.url!, orderId };
}

/**
 * Marks an order paid once Stripe confirms payment. Safe to call more than once
 * (from the success page and from the webhook).
 */
export async function finalizeCheckout(sessionId: string, base: string) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["payment_intent.latest_charge"] });
  const orderId = session.metadata?.order_id;
  if (!orderId) return null;
  const order = await getOrder(orderId);
  if (!order) return null;
  if (order.status !== "pending_payment") return order; // already handled
  if (session.payment_status !== "paid") return order;

  const pi = session.payment_intent as Stripe.PaymentIntent | null;
  const charge = (pi?.latest_charge ?? null) as Stripe.Charge | null;
  const ship = session.collected_information?.shipping_details ?? null;

  const admin = createAdminClient();
  const { data: updated, error } = await admin
    .from("orders")
    .update({
      status: "paid_held",
      stripe_payment_intent_id: pi?.id ?? null,
      stripe_charge_id: charge?.id ?? null,
      seller_payout_cents: order.amount_cents - order.commission_cents,
      shipping_name: ship?.name ?? null,
      shipping_address: ship?.address ? { ...ship.address, phone: session.customer_details?.phone ?? null } : null,
    })
    .eq("id", orderId)
    .eq("status", "pending_payment")
    .select("id")
    .maybeSingle();
  if (error) {
    // Most likely someone else already bought it (one active order per listing).
    console.error("[orders] couldn't mark paid — refunding", error);
    if (pi?.id) await stripe.refunds.create({ payment_intent: pi.id, reason: "duplicate" });
    await admin.from("orders").update({ status: "refunded", refunded_at: new Date().toISOString() }).eq("id", orderId);
    return getOrder(orderId);
  }
  if (!updated) return getOrder(orderId);

  await Promise.all([
    admin.from("listings").update({ status: "reserved" }).eq("id", order.listing_id),
    order.offer_id ? admin.from("offers").update({ status: "paid" }).eq("id", order.offer_id) : Promise.resolve(),
    admin.from("offers").update({ status: "cancelled" }).eq("listing_id", order.listing_id).eq("status", "open"),
  ]);

  const title = await listingTitle(order.listing_id);
  const amount = formatUsd(order.amount_cents);
  await Promise.all([
    notify(
      order.seller_id,
      `Sold: ${title} — please ${order.fulfillment === "ship" ? "ship it" : "arrange pickup"}`,
      order.fulfillment === "ship"
        ? `The buyer paid ${amount}. RIHOSO is holding the payment. Ship the watch fully insured with signature required, then add the tracking number on the order page. You'll be paid when the buyer confirms receipt, or ${AUTO_RELEASE_DAYS} days after delivery.`
        : `The buyer paid ${amount}. RIHOSO is holding the payment. Message the buyer to arrange pickup. You'll be paid as soon as the buyer confirms they have the watch.`,
      order.id,
      base
    ),
    notify(
      order.buyer_id,
      `Payment received for ${title}`,
      `Thank you — your ${amount} payment is being held safely by RIHOSO. The seller has been told to ${order.fulfillment === "ship" ? "ship your watch" : "arrange pickup with you"}. When you have it, confirm on the order page so the seller is paid. If it isn't as described, report a problem there before confirming.`,
      order.id,
      base
    ),
    sendNotification({
      subject: `Watch Exchange sale: ${title} (${amount})`,
      rows: [
        ["Order", `${base}/marketplace/orders/${order.id}`],
        ["Amount", amount],
        ["RIHOSO fee", formatUsd(order.commission_cents)],
        ["Fulfilment", order.fulfillment === "ship" ? "Shipping" : "Local pickup"],
      ],
    }).catch(() => {}),
  ]);
  return getOrder(orderId);
}

/** Pays the seller their share of a held payment. */
export async function releaseOrder(orderId: string, base: string, reason: "buyer_confirmed" | "auto" | "admin") {
  const order = await getOrder(orderId);
  if (!order) throw new UserError("Order not found.");
  if (!["paid_held", "shipped", "delivered"].includes(order.status) && !(reason === "admin" && order.status === "disputed")) {
    throw new UserError("This order can't be released right now.");
  }
  const admin = createAdminClient();
  const { data: seller } = await admin
    .from("seller_accounts")
    .select("stripe_account_id")
    .eq("user_id", order.seller_id)
    .maybeSingle();
  if (!seller) throw new Error("Seller account missing");

  const payout = order.seller_payout_cents ?? order.amount_cents - order.commission_cents;
  const transfer = await getStripe().transfers.create(
    {
      amount: payout,
      currency: "usd",
      destination: seller.stripe_account_id,
      transfer_group: `order_${order.id}`,
      source_transaction: order.stripe_charge_id ?? undefined,
      description: `RIHOSO Watch Exchange payout — order ${order.id}`,
      metadata: { order_id: order.id, reason },
    },
    { idempotencyKey: `release_${order.id}` }
  );

  const now = new Date().toISOString();
  await Promise.all([
    admin
      .from("orders")
      .update({ status: "released", stripe_transfer_id: transfer.id, released_at: now, delivered_at: order.delivered_at ?? now })
      .eq("id", order.id),
    admin.from("listings").update({ status: "sold" }).eq("id", order.listing_id),
  ]);

  const title = await listingTitle(order.listing_id);
  await Promise.all([
    notify(
      order.seller_id,
      `Payment released: ${formatUsd(payout)} for ${title}`,
      `${reason === "buyer_confirmed" ? "The buyer confirmed they received the watch." : reason === "auto" ? `${AUTO_RELEASE_DAYS} days have passed since delivery with no problem reported.` : "RIHOSO has released this payment."} ${formatUsd(payout)} is on its way to your bank account (sale ${formatUsd(order.amount_cents)} minus RIHOSO's fee of ${formatUsd(order.commission_cents)}).`,
      order.id,
      base
    ),
    reason !== "buyer_confirmed"
      ? notify(order.buyer_id, `Order complete: ${title}`, "This order is complete and the seller has been paid. Enjoy your watch!", order.id, base)
      : Promise.resolve(),
  ]);
}

export class UserError extends Error {}

export async function notifyOrderEvent(
  order: OrderRow,
  event: "shipped" | "delivered" | "disputed",
  base: string,
  extra?: string
) {
  const title = await listingTitle(order.listing_id);
  if (event === "shipped") {
    await notify(
      order.buyer_id,
      `Your watch has shipped: ${title}`,
      `The seller shipped your watch${order.shipping_carrier ? ` via ${order.shipping_carrier}` : ""}${order.tracking_number ? ` (tracking ${order.tracking_number})` : ""}. When it arrives, check it and confirm on the order page.`,
      order.id,
      base
    );
  } else if (event === "delivered") {
    await notify(
      order.buyer_id,
      `Delivered: ${title} — please confirm`,
      `The seller reports your watch was delivered. Please confirm you received it as described. If there's a problem, report it on the order page within ${AUTO_RELEASE_DAYS} days — after that, payment is released to the seller automatically.`,
      order.id,
      base
    );
  } else {
    await Promise.all([
      notify(order.seller_id, `Problem reported: ${title}`, "The buyer reported a problem with this order. RIHOSO is holding the payment and will contact you both.", order.id, base, extra),
      sendNotification({
        subject: `DISPUTE on Watch Exchange order: ${title}`,
        rows: [
          ["Order", `${base}/marketplace/orders/${order.id}`],
          ["Amount", formatUsd(order.amount_cents)],
          ["Buyer's description", extra ?? ""],
        ],
      }).catch(() => {}),
    ]);
  }
}

/** Admin: refund the buyer in full and close the order (only before the seller has been paid). */
export async function refundOrder(orderId: string, base: string, note?: string) {
  const order = await getOrder(orderId);
  if (!order) throw new UserError("Order not found.");
  if (!["paid_held", "shipped", "delivered", "disputed"].includes(order.status)) {
    throw new UserError("Only orders whose payment is still held can be refunded here.");
  }
  if (!order.stripe_payment_intent_id) throw new UserError("No payment found for this order.");
  await getStripe().refunds.create(
    { payment_intent: order.stripe_payment_intent_id, metadata: { order_id: order.id } },
    { idempotencyKey: `refund_${order.id}` }
  );
  const admin = createAdminClient();
  await Promise.all([
    admin.from("orders").update({ status: "refunded", refunded_at: new Date().toISOString(), auto_release_at: null }).eq("id", order.id),
    // Put the watch back on the market as withdrawn; the seller can re-list it.
    admin.from("listings").update({ status: "withdrawn" }).eq("id", order.listing_id),
  ]);
  const title = await listingTitle(order.listing_id);
  await Promise.all([
    notify(order.buyer_id, `Refund issued: ${title}`, `RIHOSO has refunded your ${formatUsd(order.amount_cents)} payment. It usually appears on your card within 5–10 business days.`, order.id, base, note),
    notify(order.seller_id, `Order refunded: ${title}`, "RIHOSO reviewed this order and refunded the buyer. Please arrange the watch's return with the buyer in your messages if needed.", order.id, base, note),
  ]);
}

export async function isAdmin(userId: string) {
  const { data } = await createAdminClient().from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  return Boolean(data);
}
