import "server-only";
import type Stripe from "stripe";
import { sendMemberEmail, sendNotification } from "@/lib/email";
import { SERVICES, formatUsd } from "@/lib/marketplace";
import { getStripe } from "@/lib/stripe";
import { createAdminClient, getUserEmail } from "@/lib/supabase/admin";
import { UserError } from "@/lib/orders";

export type ServiceRequest = {
  id: string;
  type: "validation" | "repair";
  requester_id: string;
  listing_id: string | null;
  description: string;
  status: "requested" | "awaiting_payment" | "paid" | "in_progress" | "complete" | "cancelled";
  price_cents: number | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  result_notes: string | null;
  paid_at: string | null;
  refunded_at: string | null;
  created_at: string;
};

const COLUMNS =
  "id, type, requester_id, listing_id, description, status, price_cents, stripe_checkout_session_id, stripe_payment_intent_id, result_notes, paid_at, refunded_at, created_at";

export async function getServiceRequest(id: string) {
  const { data } = await createAdminClient().from("service_requests").select(COLUMNS).eq("id", id).maybeSingle();
  return (data as ServiceRequest | null) ?? null;
}

const LABEL = { validation: SERVICES.validation.name, repair: SERVICES.repair.name } as const;

async function listingTitle(listingId: string | null) {
  if (!listingId) return null;
  const { data } = await createAdminClient().from("listings").select("title").eq("id", listingId).maybeSingle();
  return data?.title ?? null;
}

/** Opens Stripe Checkout for a service request awaiting payment. */
export async function startServiceCheckout(requestId: string, userId: string, base: string) {
  const req = await getServiceRequest(requestId);
  if (!req || req.requester_id !== userId) throw new UserError("Request not found.");
  if (req.status !== "awaiting_payment" || !req.price_cents) throw new UserError("This request isn't ready for payment.");
  const title = await listingTitle(req.listing_id);
  const email = await getUserEmail(userId);

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: email ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: req.price_cents,
          product: req.type === "validation" ? SERVICES.validation.stripeProductId : SERVICES.repair.stripeProductId,
        },
      },
    ],
    payment_intent_data: {
      description: `RIHOSO ${LABEL[req.type]}${title ? ` — ${title}` : ""}`,
      metadata: { kind: "service", service_request_id: req.id },
    },
    metadata: { kind: "service", service_request_id: req.id },
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    success_url: `${base}/marketplace/requests/${req.id}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/marketplace/requests/${req.id}`,
  });
  await createAdminClient().from("service_requests").update({ stripe_checkout_session_id: session.id }).eq("id", req.id);
  return session.url!;
}

/** Marks a service request paid once Stripe confirms. Safe to call repeatedly. */
export async function finalizeServiceCheckout(sessionId: string, base: string) {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  const id = session.metadata?.service_request_id;
  if (!id) return null;
  const req = await getServiceRequest(id);
  if (!req || req.status !== "awaiting_payment" || session.payment_status !== "paid") return req;

  const admin = createAdminClient();
  const pi = session.payment_intent as string | Stripe.PaymentIntent | null;
  const { data: updated } = await admin
    .from("service_requests")
    .update({ status: "paid", paid_at: new Date().toISOString(), stripe_payment_intent_id: typeof pi === "string" ? pi : pi?.id ?? null })
    .eq("id", id)
    .eq("status", "awaiting_payment")
    .select("id")
    .maybeSingle();
  if (!updated) return getServiceRequest(id);

  if (req.type === "validation" && req.listing_id) {
    await admin.from("listings").update({ validation_status: "requested" }).eq("id", req.listing_id).eq("validation_status", "none");
  }
  const title = await listingTitle(req.listing_id);
  const amount = formatUsd(req.price_cents ?? 0);
  await Promise.all([
    sendNotification({
      subject: `PAID: ${LABEL[req.type]} ${title ? `— ${title}` : ""} (${amount})`,
      rows: [
        ["Request", `${base}/marketplace/admin`],
        ["Amount", amount],
        ["Details", req.description || "—"],
      ],
    }).catch(() => {}),
    (async () => {
      const to = await getUserEmail(req.requester_id);
      if (to)
        await sendMemberEmail({
          to,
          subject: `Payment received — RIHOSO ${LABEL[req.type]}`,
          intro:
            req.type === "validation"
              ? `Thank you — your ${amount} payment for a member validation${title ? ` of “${title}”` : ""} is confirmed. A RIHOSO member will be in touch to examine the watch, and the result will appear on the listing.`
              : `Thank you — your ${amount} payment for the repair is confirmed. RIHOSO will be in touch to arrange drop-off or shipping.`,
          ctaLabel: "View request",
          ctaUrl: `${base}/marketplace/requests/${req.id}`,
        });
    })().catch((err) => console.error("[services] email failed", err)),
  ]);
  return getServiceRequest(id);
}

/** Admin: send a repair quote. */
export async function quoteRepair(id: string, amountCents: number, note: string, base: string) {
  const req = await getServiceRequest(id);
  if (!req || req.type !== "repair") throw new UserError("Repair request not found.");
  if (!["requested", "awaiting_payment"].includes(req.status)) throw new UserError("This request can't be quoted now.");
  if (!Number.isFinite(amountCents) || amountCents < 100) throw new UserError("Enter a quote of at least $1.");
  await createAdminClient()
    .from("service_requests")
    .update({ status: "awaiting_payment", price_cents: amountCents, result_notes: note || null })
    .eq("id", id);
  const to = await getUserEmail(req.requester_id);
  if (to)
    await sendMemberEmail({
      to,
      subject: `Your RIHOSO repair quote: ${formatUsd(amountCents)}`,
      intro: `RIHOSO has quoted ${formatUsd(amountCents)} for your repair. Review the details and pay securely to book it in.`,
      quote: note || undefined,
      ctaLabel: "Review and pay",
      ctaUrl: `${base}/marketplace/requests/${id}`,
    });
}

/** Admin: cancel a request; refunds automatically if it was paid and not yet complete. */
export async function cancelServiceRequest(id: string, base: string) {
  const req = await getServiceRequest(id);
  if (!req) throw new UserError("Request not found.");
  if (["complete", "cancelled"].includes(req.status)) throw new UserError("Already closed.");
  const admin = createAdminClient();
  let refunded = false;
  if (["paid", "in_progress"].includes(req.status) && req.stripe_payment_intent_id) {
    await getStripe().refunds.create(
      { payment_intent: req.stripe_payment_intent_id, metadata: { service_request_id: id } },
      { idempotencyKey: `service_refund_${id}` }
    );
    refunded = true;
  }
  await admin
    .from("service_requests")
    .update({ status: "cancelled", refunded_at: refunded ? new Date().toISOString() : null })
    .eq("id", id);
  if (req.type === "validation" && req.listing_id) {
    await admin.from("listings").update({ validation_status: "none" }).eq("id", req.listing_id).in("validation_status", ["requested", "in_progress"]);
  }
  const to = await getUserEmail(req.requester_id);
  if (to)
    await sendMemberEmail({
      to,
      subject: `RIHOSO ${LABEL[req.type]} cancelled`,
      intro: refunded
        ? `Your ${LABEL[req.type].toLowerCase()} request was cancelled and your ${formatUsd(req.price_cents ?? 0)} payment has been refunded. It usually appears within 5–10 business days.`
        : `Your ${LABEL[req.type].toLowerCase()} request was cancelled.`,
      ctaLabel: "View request",
      ctaUrl: `${base}/marketplace/requests/${id}`,
    });
  return refunded;
}
