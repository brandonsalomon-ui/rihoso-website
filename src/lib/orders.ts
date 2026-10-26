import "server-only";
import type Stripe from "stripe";
import { sendMemberEmail, sendNotification } from "@/lib/email";
import { addBusinessDays } from "@/lib/business-days";
import { commissionCents, formatUsd } from "@/lib/marketplace";
import { INSPECTION_HOURS, PICKUP_DAYS, SHIP_BUSINESS_DAYS } from "@/lib/policies";
import { getStripe, siteUrl } from "@/lib/stripe";
import { createAdminClient, getUserEmail } from "@/lib/supabase/admin";

export { INSPECTION_HOURS };

export function fmtWhen(iso: string | Date) {
  return new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" }) + " ET";
}

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
  refunded_at: string | null;
  paid_at: string | null;
  ship_by: string | null;
  ship_overdue_notified_at: string | null;
  pickup_deadline: string | null;
  delivery_reported_at: string | null;
  receipt_verified_by: "buyer" | "admin" | null;
  handover_reported_at: string | null;
  decision_note: string | null;
  decided_at: string | null;
  return_approved_at: string | null;
  return_carrier: string | null;
  return_tracking: string | null;
  return_shipped_at: string | null;
  return_received_at: string | null;
  return_problem: string | null;
  return_problem_at: string | null;
  refunded_amount_cents: number;
  created_at: string;
};

const ORDER_COLUMNS =
  "id, listing_id, buyer_id, seller_id, offer_id, conversation_id, amount_cents, commission_cents, seller_payout_cents, status, fulfillment, stripe_checkout_session_id, stripe_payment_intent_id, stripe_charge_id, stripe_transfer_id, shipping_name, shipping_address, shipping_carrier, tracking_number, shipped_at, delivered_at, auto_release_at, released_at, dispute_reason, disputed_at, refunded_at, paid_at, ship_by, ship_overdue_notified_at, pickup_deadline, delivery_reported_at, receipt_verified_by, handover_reported_at, decision_note, decided_at, return_approved_at, return_carrier, return_tracking, return_shipped_at, return_received_at, return_problem, return_problem_at, refunded_amount_cents, created_at";

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
                ? `Shipped fully insured with signature. Held by RIHOSO until you accept it, or ${INSPECTION_HOURS} hours after verified receipt with no problem reported.`
                : `Local pickup. Held by RIHOSO until you accept it, or ${INSPECTION_HOURS} hours after you confirm collection with no problem reported.`,
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
  const paidAt = new Date();
  const shipBy = order.fulfillment === "ship" ? addBusinessDays(paidAt, SHIP_BUSINESS_DAYS) : null;
  const pickupDeadline = order.fulfillment === "pickup" ? new Date(paidAt.getTime() + PICKUP_DAYS * 86400000) : null;
  const { data: updated, error } = await admin
    .from("orders")
    .update({
      status: "paid_held",
      paid_at: paidAt.toISOString(),
      ship_by: shipBy?.toISOString() ?? null,
      pickup_deadline: pickupDeadline?.toISOString() ?? null,
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
        ? `The buyer paid ${amount}. RIHOSO is holding the payment. Ship the watch by ${fmtWhen(shipBy!)} (${SHIP_BUSINESS_DAYS} business days), fully insured for the sale price with adult signature required, then add the tracking number on the order page. If it isn't shipped by then, the buyer may cancel for a full refund. You'll be paid when the buyer accepts the watch, or ${INSPECTION_HOURS} hours after verified delivery with no problem reported.`
        : `The buyer paid ${amount}. RIHOSO is holding the payment. Message the buyer to arrange pickup by ${fmtWhen(pickupDeadline!)} — after ${PICKUP_DAYS} days without a confirmed handover the order is cancelled and refunded. At the handover, mark it on the order page; the buyer confirms too. You'll be paid when the buyer accepts the watch, or ${INSPECTION_HOURS} hours after the confirmed handover with no problem reported.`,
      order.id,
      base
    ),
    notify(
      order.buyer_id,
      `Payment received for ${title}`,
      order.fulfillment === "ship"
        ? `Thank you — RIHOSO is holding your ${amount} payment. The seller must ship by ${fmtWhen(shipBy!)}; if they don't, you can cancel for a full refund on the order page. When the watch arrives, confirm receipt on the order page: you then have ${INSPECTION_HOURS} hours to inspect it and report any problem before the seller is paid.`
        : `Thank you — RIHOSO is holding your ${amount} payment. Arrange pickup with the seller in your messages by ${fmtWhen(pickupDeadline!)}. When you collect the watch, confirm it on the order page: you then have ${INSPECTION_HOURS} hours to inspect it and report any problem before the seller is paid.`,
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
export async function releaseOrder(orderId: string, base: string, reason: "buyer_confirmed" | "auto" | "admin", note?: string) {
  const order = await getOrder(orderId);
  if (!order) throw new UserError("Order not found.");
  const buyerCanAccept = order.status === "delivered" || order.status === "shipped" || (order.status === "paid_held" && order.fulfillment === "pickup");
  const ok =
    (reason === "buyer_confirmed" && buyerCanAccept) ||
    (reason === "auto" && order.status === "delivered") ||
    (reason === "admin" && ["paid_held", "shipped", "delivered", "disputed"].includes(order.status));
  if (!ok) throw new UserError("This order can't be released right now.");
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
      .update({
        status: "released",
        stripe_transfer_id: transfer.id,
        released_at: now,
        delivered_at: order.delivered_at ?? now,
        auto_release_at: null,
        ...(note ? { decision_note: note, decided_at: now } : {}),
      })
      .eq("id", order.id),
    admin.from("listings").update({ status: "sold" }).eq("id", order.listing_id),
  ]);

  const title = await listingTitle(order.listing_id);
  await Promise.all([
    notify(
      order.seller_id,
      `Payment released: ${formatUsd(payout)} for ${title}`,
      `${reason === "buyer_confirmed" ? "The buyer accepted the watch." : reason === "auto" ? `The ${INSPECTION_HOURS}-hour inspection period ended with no problem reported.` : "RIHOSO has released this payment."} ${formatUsd(payout)} is on its way to your bank account (sale ${formatUsd(order.amount_cents)} minus RIHOSO's fee of ${formatUsd(order.commission_cents)}).`,
      order.id,
      base,
      note
    ),
    reason !== "buyer_confirmed"
      ? notify(
          order.buyer_id,
          `Order complete: ${title}`,
          reason === "admin"
            ? `RIHOSO reviewed this order and released payment to the seller. If you disagree, reply to info@rihoso.com within 7 days with any new evidence and we'll reconsider. This doesn't affect your rights with your card issuer or under the law.`
            : "This order is complete and the seller has been paid. If you later find a problem involving fraud, a counterfeit or title, contact info@rihoso.com with the order number. Enjoy your watch!",
          order.id,
          base,
          note
        )
      : Promise.resolve(),
  ]);
}

export class UserError extends Error {}

export async function notifyOrderEvent(
  order: OrderRow,
  event: "shipped" | "delivery_reported" | "handover_reported" | "received" | "disputed" | "ship_overdue",
  base: string,
  extra?: string
) {
  const title = await listingTitle(order.listing_id);
  if (event === "shipped") {
    await notify(
      order.buyer_id,
      `Your watch has shipped: ${title}`,
      `The seller shipped your watch${order.shipping_carrier ? ` via ${order.shipping_carrier}` : ""}${order.tracking_number ? ` (tracking ${order.tracking_number})` : ""}. When it arrives, confirm receipt on the order page to start your ${INSPECTION_HOURS}-hour inspection.`,
      order.id,
      base
    );
  } else if (event === "delivery_reported") {
    await notify(
      order.buyer_id,
      `Has your watch arrived? ${title}`,
      `The seller reports your watch was delivered. When you have it, confirm receipt on the order page — you then have ${INSPECTION_HOURS} hours to inspect it before the seller is paid. If it hasn't arrived, report that on the order page. Your inspection period doesn't start until receipt is verified.`,
      order.id,
      base
    );
  } else if (event === "handover_reported") {
    await notify(
      order.buyer_id,
      `Please confirm you collected: ${title}`,
      `The seller reports handing the watch over to you. Confirm the collection on the order page to start your ${INSPECTION_HOURS}-hour inspection. If you didn't receive it, report a problem there.`,
      order.id,
      base
    );
  } else if (event === "received") {
    await Promise.all([
      notify(
        order.buyer_id,
        `Inspection period started: ${title}`,
        `Receipt is confirmed. You have until ${fmtWhen(order.auto_release_at!)} to inspect the watch and report a problem on the order page. If it's as described, you can accept it now to pay the seller. Please don't alter, service, resize or open the watch while you inspect it.`,
        order.id,
        base
      ),
      notify(
        order.seller_id,
        `Received by the buyer: ${title}`,
        `Receipt is confirmed. Unless the buyer reports a problem, your payment is released at ${fmtWhen(order.auto_release_at!)} or sooner if they accept the watch.`,
        order.id,
        base
      ),
    ]);
  } else if (event === "ship_overdue") {
    await Promise.all([
      notify(
        order.buyer_id,
        `Not shipped yet: ${title}`,
        `The seller hasn't added tracking by the ${SHIP_BUSINESS_DAYS}-business-day deadline. You can cancel the order for a full refund on the order page, or keep waiting — your payment stays held either way.`,
        order.id,
        base
      ),
      notify(
        order.seller_id,
        `Shipping deadline passed: ${title}`,
        `This order wasn't marked shipped within ${SHIP_BUSINESS_DAYS} business days. The buyer may now cancel for a full refund. If you need more time, message the buyer with a new date — they can still cancel.`,
        order.id,
        base
      ),
    ]);
  } else {
    await Promise.all([
      notify(order.seller_id, `Problem reported: ${title}`, "The buyer reported a problem with this order. RIHOSO is holding the payment. Please reply with any evidence (photos, tracking, messages) within 2 business days — reply to info@rihoso.com or message the buyer on RIHOSO.", order.id, base, extra),
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

/**
 * Refunds the buyer in full and closes the order (only while the payment is still held).
 * `outcome` "cancelled" is used for missed shipping or pickup deadlines.
 */
export async function refundOrder(
  orderId: string,
  base: string,
  note?: string,
  opts: { outcome?: "refunded" | "cancelled"; buyerText?: string; sellerText?: string } = {}
) {
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
  const now = new Date().toISOString();
  await Promise.all([
    admin
      .from("orders")
      .update({
        status: opts.outcome ?? "refunded",
        refunded_at: now,
        refunded_amount_cents: order.amount_cents,
        auto_release_at: null,
        ...(note ? { decision_note: note, decided_at: now } : {}),
      })
      .eq("id", order.id),
    // Take the watch off the market; the seller can re-list it.
    admin.from("listings").update({ status: "withdrawn" }).eq("id", order.listing_id),
  ]);
  const title = await listingTitle(order.listing_id);
  await Promise.all([
    notify(
      order.buyer_id,
      `Refund issued: ${title}`,
      opts.buyerText ?? `RIHOSO has refunded your ${formatUsd(order.amount_cents)} payment in full. It usually appears on your card within 5–10 business days.`,
      order.id,
      base,
      note
    ),
    notify(
      order.seller_id,
      `Order refunded: ${title}`,
      opts.sellerText ??
        "RIHOSO refunded the buyer for this order. No fee is charged on a refunded sale. If you disagree, reply to info@rihoso.com within 7 days with any new evidence and we'll reconsider.",
      order.id,
      base,
      note
    ),
  ]);
}

/**
 * Admin: refund part of a disputed order and release the rest to the seller.
 * RIHOSO's fee is reduced in proportion to the amount kept by the seller.
 */
export async function partialRefund(orderId: string, refundCents: number, base: string, note: string) {
  const order = await getOrder(orderId);
  if (!order) throw new UserError("Order not found.");
  if (!["shipped", "delivered", "disputed"].includes(order.status)) throw new UserError("Partial refunds are for held orders under review.");
  if (!Number.isInteger(refundCents) || refundCents <= 0 || refundCents >= order.amount_cents) {
    throw new UserError("Enter a partial amount less than the full price.");
  }
  if (!order.stripe_payment_intent_id) throw new UserError("No payment found for this order.");
  const admin = createAdminClient();
  const { data: seller } = await admin.from("seller_accounts").select("stripe_account_id").eq("user_id", order.seller_id).maybeSingle();
  if (!seller) throw new Error("Seller account missing");

  const kept = order.amount_cents - refundCents;
  const commission = Math.round((order.commission_cents * kept) / order.amount_cents);
  const payout = kept - commission;
  const stripe = getStripe();
  await stripe.refunds.create(
    { payment_intent: order.stripe_payment_intent_id, amount: refundCents, metadata: { order_id: order.id, partial: "true" } },
    { idempotencyKey: `partial_refund_${order.id}` }
  );
  const transfer = await stripe.transfers.create(
    {
      amount: payout,
      currency: "usd",
      destination: seller.stripe_account_id,
      transfer_group: `order_${order.id}`,
      source_transaction: order.stripe_charge_id ?? undefined,
      description: `RIHOSO Watch Exchange payout (after partial refund) — order ${order.id}`,
      metadata: { order_id: order.id, reason: "admin_partial" },
    },
    { idempotencyKey: `release_${order.id}` }
  );
  const now = new Date().toISOString();
  await Promise.all([
    admin
      .from("orders")
      .update({
        status: "released",
        stripe_transfer_id: transfer.id,
        released_at: now,
        auto_release_at: null,
        refunded_amount_cents: refundCents,
        commission_cents: commission,
        seller_payout_cents: payout,
        decision_note: note,
        decided_at: now,
      })
      .eq("id", order.id),
    admin.from("listings").update({ status: "sold" }).eq("id", order.listing_id),
  ]);
  const title = await listingTitle(order.listing_id);
  await Promise.all([
    notify(order.buyer_id, `Partial refund: ${title}`, `RIHOSO reviewed this order and refunded ${formatUsd(refundCents)} to you. If you disagree, reply to info@rihoso.com within 7 days with any new evidence and we'll reconsider.`, order.id, base, note),
    notify(order.seller_id, `Partial refund and payout: ${title}`, `RIHOSO reviewed this order: ${formatUsd(refundCents)} was refunded to the buyer and ${formatUsd(payout)} is on its way to you (RIHOSO's fee reduced to ${formatUsd(commission)}). If you disagree, reply to info@rihoso.com within 7 days with any new evidence.`, order.id, base, note),
  ]);
}

/** Admin: approve a not-as-described return. Payment stays held until the watch is back. */
export async function approveReturn(orderId: string, base: string, note: string) {
  const order = await getOrder(orderId);
  if (!order) throw new UserError("Order not found.");
  if (order.status !== "disputed") throw new UserError("Returns are approved from a reported problem.");
  const now = new Date().toISOString();
  await createAdminClient().from("orders").update({ return_approved_at: now, decision_note: note, decided_at: now }).eq("id", order.id);
  const title = await listingTitle(order.listing_id);
  await Promise.all([
    notify(
      order.buyer_id,
      `Return approved: ${title}`,
      "RIHOSO approved your return. The seller will send you a prepaid, insured return label in your messages. Ship the complete watch and everything it came with within 5 business days of receiving the label, then enter the return tracking on the order page. You'll be refunded in full once the seller confirms it's back, or 2 business days after verified delivery to them. If you follow the approved method, you're not responsible for loss in transit.",
      order.id,
      base,
      note
    ),
    notify(
      order.seller_id,
      `Return approved: ${title}`,
      "RIHOSO approved the buyer's return. Within 2 business days, send the buyer a prepaid return label in your messages, insured for the full sale price with signature required. When the watch arrives, inspect it and confirm on the order page within 2 business days. The buyer is refunded once you confirm, or automatically 2 business days after verified delivery unless you report a specific problem. If you disagree with the decision, reply to info@rihoso.com within 7 days with new evidence.",
      order.id,
      base,
      note
    ),
  ]);
}

/** Marks receipt (or a pickup handover) as verified and starts the 72-hour inspection period. */
export async function verifyReceipt(orderId: string, by: "buyer" | "admin", base: string) {
  const order = await getOrder(orderId);
  if (!order) throw new UserError("Order not found.");
  const allowed = order.fulfillment === "ship" ? order.status === "shipped" : order.status === "paid_held";
  if (!allowed) throw new UserError("Receipt can't be confirmed for this order right now.");
  const now = new Date();
  const releaseAt = new Date(now.getTime() + INSPECTION_HOURS * 3600 * 1000);
  const { data } = await createAdminClient()
    .from("orders")
    .update({ status: "delivered", delivered_at: now.toISOString(), receipt_verified_by: by, auto_release_at: releaseAt.toISOString() })
    .eq("id", order.id)
    .eq("status", order.status)
    .select("id")
    .maybeSingle();
  if (!data) return; // already changed
  await notifyOrderEvent({ ...order, auto_release_at: releaseAt.toISOString() }, "received", base);
}

export async function isAdmin(userId: string) {
  const { data } = await createAdminClient().from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  return Boolean(data);
}
