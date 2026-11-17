import "server-only";
import type Stripe from "stripe";
import { brandonCopy, sendMemberEmail, sendNotification } from "@/lib/email";
import { contactMethodLabel, formatUsd } from "@/lib/marketplace";
import { formatDate } from "@/lib/memberships";
import { UserError } from "@/lib/orders";
import {
  FEE_SCHEDULE_TEXT,
  PARTNER_PRICE_CENTS,
  PARTNER_TERM_MONTHS,
  QUOTE_WINDOW_HOURS,
  RENEW_WINDOW_DAYS,
  jobStatusLabel,
  referralFeeCents,
  type JobStatus,
} from "@/lib/repair-partner-rules";
import { getServiceRequest, repairWatchName } from "@/lib/services";
import { getStripe } from "@/lib/stripe";
import { createAdminClient, findOrCreateUserByEmail, getUserEmail } from "@/lib/supabase/admin";

export type RepairPartner = {
  id: string;
  user_id: string;
  business_name: string;
  contact_name: string;
  phone: string | null;
  website: string | null;
  city: string | null;
  address: string | null;
  blurb: string | null;
  status: "pending_payment" | "pending_approval" | "active" | "inactive" | "declined";
  amount_cents: number | null;
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
  approved_at: string | null;
  period_end: string | null;
  refunded_at: string | null;
  created_at: string;
};

export type RepairQuote = {
  id: string;
  request_id: string;
  partner_id: string;
  status: "invited" | "quoted" | "declined" | "selected" | "not_selected" | "cancelled";
  price_cents: number | null;
  includes: string | null;
  turnaround: string | null;
  warranty: string | null;
  dropoff: boolean;
  notes: string | null;
  quoted_at: string | null;
  selected_at: string | null;
  job_status: JobStatus | null;
  fee_cents: number | null;
  fee_paid_at: string | null;
  created_at: string;
};

const PARTNER_COLUMNS =
  "id, user_id, business_name, contact_name, phone, website, city, address, blurb, status, amount_cents, stripe_payment_intent_id, paid_at, approved_at, period_end, refunded_at, created_at";
const QUOTE_COLUMNS =
  "id, request_id, partner_id, status, price_cents, includes, turnaround, warranty, dropoff, notes, quoted_at, selected_at, job_status, fee_cents, fee_paid_at, created_at";

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function fmtWhen(iso: string) {
  return new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/** Partners who can receive leads right now: approved and within their paid year. */
export async function activePartners() {
  const { data } = await createAdminClient()
    .from("repair_partners")
    .select(PARTNER_COLUMNS)
    .eq("status", "active")
    .gt("period_end", new Date().toISOString())
    .order("business_name");
  return (data ?? []) as RepairPartner[];
}

export async function getPartnerForUser(userId: string) {
  const { data } = await createAdminClient().from("repair_partners").select(PARTNER_COLUMNS).eq("user_id", userId).maybeSingle();
  return (data as RepairPartner | null) ?? null;
}

export async function getPartner(id: string) {
  const { data } = await createAdminClient().from("repair_partners").select(PARTNER_COLUMNS).eq("id", id).maybeSingle();
  return (data as RepairPartner | null) ?? null;
}

export async function quotesForRequest(requestId: string) {
  const { data } = await createAdminClient()
    .from("repair_quotes")
    .select(`${QUOTE_COLUMNS}, repair_partners(business_name, city, user_id)`)
    .eq("request_id", requestId)
    .order("created_at");
  return (data ?? []) as unknown as (RepairQuote & {
    repair_partners: Pick<RepairPartner, "business_name" | "city" | "user_id"> | null;
  })[];
}

export async function quotesForPartner(partnerId: string) {
  const { data } = await createAdminClient()
    .from("repair_quotes")
    .select(QUOTE_COLUMNS)
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []) as RepairQuote[];
}

/** Whether a partner may pay now: new application, re-application, lapsed, or within the renewal window. */
export function canPay(p: RepairPartner | null) {
  if (!p) return true;
  if (p.status === "pending_payment" || p.status === "declined") return true;
  // Active or paused partners renew in the last weeks of their year (or after it lapses). A pause stays in place.
  if ((p.status === "active" || p.status === "inactive") && p.period_end) {
    return new Date(p.period_end).getTime() - Date.now() < RENEW_WINDOW_DAYS * 86400000;
  }
  return false;
}

/** Saves the shop's details and opens Stripe Checkout for the annual partner sponsorship. */
export async function startPartnerCheckout(
  userId: string,
  email: string,
  d: { businessName: string; contactName: string; phone: string; website: string; city: string; address: string; blurb: string },
  base: string
) {
  const admin = createAdminClient();
  const existing = await getPartnerForUser(userId);
  if (!canPay(existing)) {
    throw new UserError(
      existing?.status === "pending_approval"
        ? "Your application is already paid and waiting for RIHOSO's approval."
        : "Your partnership is active. Renewal opens 30 days before it ends."
    );
  }
  const details = {
    business_name: d.businessName,
    contact_name: d.contactName,
    phone: d.phone || null,
    website: d.website || null,
    city: d.city || null,
    address: d.address || null,
    blurb: d.blurb || null,
  };
  let partnerId: string;
  if (existing) {
    // Re-applying after a decline starts the application over; renewals keep their status until paid.
    const reset = existing.status === "declined" ? { status: "pending_payment", refunded_at: null } : {};
    const { error } = await admin.from("repair_partners").update({ ...details, ...reset }).eq("id", existing.id);
    if (error) throw error;
    partnerId = existing.id;
  } else {
    const { data, error } = await admin
      .from("repair_partners")
      .insert({ user_id: userId, ...details, amount_cents: PARTNER_PRICE_CENTS })
      .select("id")
      .single();
    if (error) throw error;
    partnerId = data.id as string;
  }

  const renewal = Boolean(existing?.approved_at) && existing?.status !== "declined";
  const metadata = { kind: "repair_partner", partner_id: partnerId };
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: PARTNER_PRICE_CENTS,
          product_data: {
            name: `RIHOSO Repair Partner — ${PARTNER_TERM_MONTHS / 12}-year sponsorship`,
            description: renewal
              ? `Renewal for ${d.businessName}. Does not renew automatically.`
              : `${d.businessName}. Leads begin once RIHOSO approves your application; refunded in full if not approved.`,
          },
        },
      },
    ],
    payment_intent_data: { description: `RIHOSO Repair Partner — ${d.businessName}`, metadata },
    metadata,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    success_url: `${base}/repair-partners/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/repair-partners#join`,
  });
  await admin.from("repair_partners").update({ stripe_checkout_session_id: session.id }).eq("id", partnerId);
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

/** Records a paid partner sponsorship (new → waits for approval; renewal → extends the year). Safe to repeat. */
export async function finalizePartnerCheckout(sessionId: string, base: string) {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  const id = session.metadata?.partner_id;
  if (!id || session.metadata?.kind !== "repair_partner") return null;
  const p = await getPartner(id);
  if (!p || session.payment_status !== "paid") return p;
  const pi = session.payment_intent as string | Stripe.PaymentIntent | null;
  const piId = typeof pi === "string" ? pi : pi?.id ?? null;
  if (!piId || p.stripe_payment_intent_id === piId) return p; // already recorded

  const admin = createAdminClient();
  const renewal = Boolean(p.approved_at) && (p.status === "active" || p.status === "inactive");
  const now = new Date();
  const update = renewal
    ? {
        status: p.status === "inactive" ? "inactive" : "active",
        paid_at: now.toISOString(),
        stripe_payment_intent_id: piId,
        amount_cents: session.amount_total ?? PARTNER_PRICE_CENTS,
        period_end: addMonths(p.period_end && new Date(p.period_end) > now ? new Date(p.period_end) : now, PARTNER_TERM_MONTHS).toISOString(),
      }
    : {
        status: "pending_approval",
        paid_at: now.toISOString(),
        stripe_payment_intent_id: piId,
        amount_cents: session.amount_total ?? PARTNER_PRICE_CENTS,
      };
  const { data: updated } = await admin
    .from("repair_partners")
    .update(update)
    .eq("id", id)
    .or(`stripe_payment_intent_id.is.null,stripe_payment_intent_id.neq.${piId}`)
    .select(PARTNER_COLUMNS)
    .maybeSingle();
  if (!updated) return getPartner(id);
  const partner = updated as RepairPartner;
  const email = await getUserEmail(partner.user_id);

  await sendNotification({
    subject: renewal ? `Repair partner renewed: ${partner.business_name}` : `Repair partner application: ${partner.business_name} — approve in admin`,
    replyTo: email ?? undefined,
    rows: [
      ["Business", partner.business_name],
      ["Contact", partner.contact_name],
      ["Email", email ?? ""],
      ["Phone", partner.phone ?? "—"],
      ["City", partner.city ?? "—"],
      ["Website", partner.website ?? "—"],
      ["About", partner.blurb ?? "—"],
      ["Paid", formatUsd(partner.amount_cents ?? PARTNER_PRICE_CENTS)],
      ...(renewal ? ([["Active until", formatDate(partner.period_end!)]] as [string, string][]) : []),
      ["Admin", `${base}/marketplace/admin#repair-partners`],
    ],
  }).catch((err) => console.error("[partners] notification failed", err));

  if (email) {
    await sendMemberEmail({
      to: email,
      subject: renewal ? "Your RIHOSO Repair Partner sponsorship is renewed" : "We received your RIHOSO Repair Partner application",
      intro: renewal
        ? `Thank you. ${partner.business_name} stays a RIHOSO Repair Partner through ${formatDate(partner.period_end!)}.`
        : `Thank you for applying, ${partner.contact_name.split(/\s+/)[0]}. Your ${formatUsd(partner.amount_cents ?? PARTNER_PRICE_CENTS)} payment is received. RIHOSO will review ${partner.business_name} and email you when you're approved; repair leads start then. If we can't approve the application, the payment is refunded in full.`,
      ctaLabel: "Your partner dashboard",
      ctaUrl: `${base}/partner`,
      replyTo: "membership@rihoso.com",
      bcc: brandonCopy(),
    }).catch((err) => console.error("[partners] email failed", err));
  }
  return partner;
}

/** Admin: approve a paid application. The partner's year starts today. */
export async function approvePartner(id: string, base: string) {
  const p = await getPartner(id);
  if (!p) throw new UserError("Partner not found.");
  if (p.status !== "pending_approval") throw new UserError("Only paid applications waiting for approval can be approved.");
  const now = new Date();
  const periodEnd = addMonths(now, PARTNER_TERM_MONTHS).toISOString();
  await createAdminClient()
    .from("repair_partners")
    .update({ status: "active", approved_at: now.toISOString(), period_end: periodEnd })
    .eq("id", id);
  const email = await getUserEmail(p.user_id);
  if (email)
    await sendMemberEmail({
      to: email,
      subject: "You're a RIHOSO Repair Partner",
      intro: `Welcome, ${p.business_name}. You're approved as a RIHOSO Repair Partner through ${formatDate(periodEnd)}. When a customer sends you a repair request, you'll get an email; sign in to your dashboard with this email address to see the photos and send your quote.`,
      paragraphs: [
        "Customers compare quotes side by side, so a clear description of what's included, your turnaround and your warranty matters as much as the price.",
        `RIHOSO's referral fee is included in your quoted price: ${FEE_SCHEDULE_TEXT}.`,
      ],
      ctaLabel: "Open your partner dashboard",
      ctaUrl: `${base}/partner`,
      replyTo: "membership@rihoso.com",
      bcc: brandonCopy(),
    });
}

/**
 * Admin: adds a workshop as a partner at no charge (e.g. founding partners), active immediately until `through`.
 * Creates their sign-in account from the email if they don't have one. After `through` they renew at the normal price.
 */
export async function addComplimentaryPartner(
  d: {
    email: string;
    businessName: string;
    contactName: string;
    phone: string;
    website: string;
    city: string;
    address: string;
    blurb: string;
    through: Date;
    sendWelcome: boolean;
  },
  base: string
) {
  const userId = await findOrCreateUserByEmail(d.email, { display_name: d.contactName });
  const admin = createAdminClient();
  const existing = await getPartnerForUser(userId);
  const now = new Date();
  // Never shorten a year someone already paid for.
  const periodEnd =
    existing?.period_end && new Date(existing.period_end) > d.through ? new Date(existing.period_end) : d.through;
  const row = {
    business_name: d.businessName,
    contact_name: d.contactName,
    phone: d.phone || null,
    website: d.website || null,
    city: d.city || null,
    address: d.address || null,
    blurb: d.blurb || null,
    status: "active",
    approved_at: existing?.approved_at ?? now.toISOString(),
    period_end: periodEnd.toISOString(),
    refunded_at: null,
  };
  const { error } = existing
    ? await admin
        .from("repair_partners")
        .update({ ...row, ...(existing.paid_at ? {} : { amount_cents: 0 }) })
        .eq("id", existing.id)
    : await admin.from("repair_partners").insert({ user_id: userId, ...row, amount_cents: 0 });
  if (error) throw error;

  let emailed = false;
  if (d.sendWelcome) {
    const renewFrom = new Date(periodEnd.getTime() - RENEW_WINDOW_DAYS * 86400000);
    const res = await sendMemberEmail({
      to: d.email,
      subject: "You're a RIHOSO Repair Partner",
      intro: `Welcome, ${d.businessName}. RIHOSO has added you as a Repair Partner, complimentary through ${formatDate(periodEnd.toISOString())}. When a customer asks you to quote on a repair, you'll get an email. Sign in to your partner dashboard with this email address (${d.email}) to see the photos and send your quote.`,
      paragraphs: [
        "Customers compare quotes side by side, so a clear description of what's included, your turnaround and your warranty matters as much as the price. Only the workshop the customer chooses receives their contact details.",
        `RIHOSO's referral fee is included in your quoted price: ${FEE_SCHEDULE_TEXT}.`,
        `To keep receiving requests after ${formatDate(periodEnd.toISOString())}, you can renew from your dashboard starting ${formatDate(renewFrom.toISOString())} (${formatUsd(PARTNER_PRICE_CENTS)} a year).`,
      ],
      ctaLabel: "Open your partner dashboard",
      ctaUrl: `${base}/partner`,
      replyTo: "membership@rihoso.com",
      bcc: brandonCopy(),
    }).catch((err) => {
      console.error("[partners] welcome email failed", err);
      return null;
    });
    emailed = Boolean(res?.ok);
  }
  return { emailed, periodEnd: periodEnd.toISOString() };
}

/** Admin: decline an application and refund it in full. */
export async function declinePartner(id: string, note: string, base: string) {
  const p = await getPartner(id);
  if (!p) throw new UserError("Partner not found.");
  if (!["pending_approval", "pending_payment"].includes(p.status)) throw new UserError("Only applications waiting for approval can be declined.");
  let refunded = false;
  if (p.status === "pending_approval" && p.stripe_payment_intent_id) {
    await getStripe().refunds.create(
      { payment_intent: p.stripe_payment_intent_id, metadata: { repair_partner_id: id } },
      { idempotencyKey: `partner_refund_${p.stripe_payment_intent_id}` }
    );
    refunded = true;
  }
  await createAdminClient()
    .from("repair_partners")
    .update({ status: "declined", refunded_at: refunded ? new Date().toISOString() : null })
    .eq("id", id);
  const email = await getUserEmail(p.user_id);
  if (email)
    await sendMemberEmail({
      to: email,
      subject: "Your RIHOSO Repair Partner application",
      intro: `Thank you for your interest in the RIHOSO Repair Partner program. We're not able to approve ${p.business_name} at this time.${refunded ? ` Your ${formatUsd(p.amount_cents ?? PARTNER_PRICE_CENTS)} payment has been refunded in full; it usually appears within 5–10 business days.` : ""}`,
      ...(note ? { quote: note } : {}),
      ctaLabel: "RIHOSO Repairs",
      ctaUrl: `${base}/repairs`,
      replyTo: "membership@rihoso.com",
      bcc: brandonCopy(),
    });
}

/** Admin: pause or resume an approved partner's leads. */
export async function setPartnerActive(id: string, active: boolean) {
  const p = await getPartner(id);
  if (!p || !p.approved_at) throw new UserError("Only approved partners can be paused or resumed.");
  await createAdminClient().from("repair_partners").update({ status: active ? "active" : "inactive" }).eq("id", id);
}

/** Sends a new repair request to the chosen partner workshops (they don't see the customer's contact details). */
export async function invitePartners(requestId: string, partners: RepairPartner[], base: string) {
  const req = await getServiceRequest(requestId);
  if (!req) return;
  const admin = createAdminClient();
  const due = new Date(Date.now() + QUOTE_WINDOW_HOURS * 3600 * 1000).toISOString();
  await admin.from("service_requests").update({ partner_mode: true, quotes_due_at: due }).eq("id", requestId);
  const { error } = await admin
    .from("repair_quotes")
    .insert(partners.map((p) => ({ request_id: requestId, partner_id: p.id })));
  if (error) throw error;
  const watch = repairWatchName(req) || "a watch";
  await Promise.all(
    partners.map(async (p) => {
      const to = await getUserEmail(p.user_id);
      if (!to) return;
      await sendMemberEmail({
        to,
        subject: `New RIHOSO repair lead: ${watch} — quote by ${fmtWhen(due)}`,
        intro: `A customer has asked ${p.business_name} to quote a repair on their ${watch}. Photos and details are in your partner dashboard. Please quote by ${fmtWhen(due)}.`,
        quote: req.description,
        paragraphs: [
          `The customer compares quotes side by side and chooses one; you'll get their contact details if they choose you. RIHOSO's referral fee is included in your price: ${FEE_SCHEDULE_TEXT}.`,
        ],
        ctaLabel: "See the request and quote",
        ctaUrl: `${base}/partner/requests/${requestId}`,
        replyTo: "membership@rihoso.com",
      }).catch((err) => console.error("[partners] lead email failed", { partner: p.id, err }));
    })
  );
}

function cleanPriceCents(v: unknown) {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}

/** Partner: send or revise a quote, or decline to quote. */
export async function submitQuote(
  userId: string,
  requestId: string,
  input: { decline?: boolean; price?: unknown; includes: string; turnaround: string; warranty: string; dropoff: boolean; notes: string },
  base: string
) {
  const partner = await getPartnerForUser(userId);
  if (!partner || partner.status !== "active") throw new UserError("Your partner account isn't active.");
  const admin = createAdminClient();
  const { data: q } = await admin
    .from("repair_quotes")
    .select(QUOTE_COLUMNS)
    .eq("request_id", requestId)
    .eq("partner_id", partner.id)
    .maybeSingle();
  const quote = q as RepairQuote | null;
  if (!quote) throw new UserError("This request wasn't sent to you.");
  if (!["invited", "quoted", "declined"].includes(quote.status)) throw new UserError("The customer has already chosen a workshop.");
  const req = await getServiceRequest(requestId);
  if (!req || req.status === "cancelled") throw new UserError("This request was cancelled.");

  if (input.decline) {
    await admin.from("repair_quotes").update({ status: "declined" }).eq("id", quote.id);
    return;
  }
  const priceCents = cleanPriceCents(input.price);
  if (!Number.isFinite(priceCents) || priceCents < 100) throw new UserError("Enter your total price.");
  if (!input.includes || input.includes.length < 10) throw new UserError("Describe what the price includes.");
  if (!input.turnaround) throw new UserError("Add your turnaround time.");
  const firstQuote = quote.status !== "quoted";
  await admin
    .from("repair_quotes")
    .update({
      status: "quoted",
      price_cents: priceCents,
      includes: input.includes,
      turnaround: input.turnaround,
      warranty: input.warranty || null,
      dropoff: input.dropoff,
      notes: input.notes || null,
      quoted_at: new Date().toISOString(),
    })
    .eq("id", quote.id);

  const to = await getUserEmail(req.requester_id);
  const watch = repairWatchName(req) || "your watch";
  if (to)
    await sendMemberEmail({
      to,
      subject: firstQuote ? `New repair quote for your ${watch}: ${formatUsd(priceCents)}` : `Updated repair quote for your ${watch}: ${formatUsd(priceCents)}`,
      intro: `${partner.business_name} has ${firstQuote ? "sent" : "updated"} a quote of ${formatUsd(priceCents)} (turnaround: ${input.turnaround}). Compare all quotes on your request page and choose the workshop you prefer.`,
      ctaLabel: "Compare quotes",
      ctaUrl: `${base}/marketplace/requests/${requestId}`,
      replyTo: "membership@rihoso.com",
    }).catch((err) => console.error("[partners] quote email failed", err));
}

/** Customer: choose one workshop's quote. The chosen workshop gets the customer's contact details. */
export async function selectQuote(userId: string, quoteId: string, base: string) {
  const admin = createAdminClient();
  const { data: q } = await admin.from("repair_quotes").select(QUOTE_COLUMNS).eq("id", quoteId).maybeSingle();
  const quote = q as RepairQuote | null;
  if (!quote) throw new UserError("Quote not found.");
  const req = await getServiceRequest(quote.request_id);
  if (!req || req.requester_id !== userId) throw new UserError("Quote not found.");
  if (req.status === "cancelled") throw new UserError("This request was cancelled.");
  if (quote.status !== "quoted" || !quote.price_cents) throw new UserError("This quote can't be chosen.");
  const partner = await getPartner(quote.partner_id);
  if (!partner) throw new UserError("Workshop not found.");

  const fee = referralFeeCents(quote.price_cents);
  const now = new Date().toISOString();
  const { data: chosen, error } = await admin
    .from("repair_quotes")
    .update({ status: "selected", selected_at: now, job_status: "accepted", fee_cents: fee })
    .eq("id", quote.id)
    .eq("status", "quoted")
    .select("id")
    .maybeSingle();
  if (error) {
    if (error.code === "23505") throw new UserError("You've already chosen a workshop for this request.");
    throw error;
  }
  if (!chosen) throw new UserError("This quote can't be chosen.");
  const { data: others } = await admin
    .from("repair_quotes")
    .update({ status: "not_selected" })
    .eq("request_id", req.id)
    .neq("id", quote.id)
    .in("status", ["invited", "quoted"])
    .select("partner_id, status");
  await admin
    .from("service_requests")
    .update({ status: "in_progress", price_cents: quote.price_cents, result_notes: `Chosen workshop: ${partner.business_name}` })
    .eq("id", req.id);

  const watch = repairWatchName(req) || "watch";
  const customerEmail = await getUserEmail(req.requester_id);
  const partnerEmail = await getUserEmail(partner.user_id);
  const method = req.contact_method ? contactMethodLabel(req.contact_method) : "Email";
  const tasks: Promise<unknown>[] = [];

  if (partnerEmail)
    tasks.push(
      sendMemberEmail({
        to: partnerEmail,
        subject: `You've been chosen: ${watch} — ${formatUsd(quote.price_cents)}`,
        intro: `${req.contact_name ?? "The customer"} chose ${partner.business_name} for their ${watch} at your quote of ${formatUsd(quote.price_cents)}. Please contact them within one business day to arrange drop-off or shipping.`,
        paragraphs: [
          `Customer: ${req.contact_name ?? ""}\nPrefers: ${method}\nEmail: ${customerEmail ?? ""}\nPhone: ${req.contact_phone ?? "—"}`,
          `RIHOSO referral fee on this job: ${formatUsd(fee)} (included in your price). Update the job's progress in your dashboard as you go.`,
        ],
        ctaLabel: "Open the job",
        ctaUrl: `${base}/partner/requests/${req.id}`,
        replyTo: "membership@rihoso.com",
      })
    );
  if (customerEmail)
    tasks.push(
      sendMemberEmail({
        to: customerEmail,
        subject: `You chose ${partner.business_name} for your ${watch}`,
        intro: `Thank you. ${partner.business_name} will contact you by ${method.toLowerCase()} to arrange drop-off or shipping for your ${watch}, at the quoted ${formatUsd(quote.price_cents)}.`,
        paragraphs: [
          "Please don't send the watch until you've spoken with the workshop. They'll confirm the final price once they've examined it, and nothing beyond the quote is done without your approval.",
          "Questions at any point? Reply to this email and RIHOSO will help.",
        ],
        ctaLabel: "View your request",
        ctaUrl: `${base}/marketplace/requests/${req.id}`,
        replyTo: "membership@rihoso.com",
      })
    );
  for (const o of (others ?? []) as { partner_id: string; status: string }[]) {
    tasks.push(
      (async () => {
        const p = await getPartner(o.partner_id);
        const to = p && (await getUserEmail(p.user_id));
        if (!p || !to) return;
        await sendMemberEmail({
          to,
          subject: `Repair request closed: ${watch}`,
          intro: `The customer has chosen another workshop for their ${watch}. Thank you for ${o.status === "quoted" ? "quoting" : "taking a look"}.`,
          ctaLabel: "Your partner dashboard",
          ctaUrl: `${base}/partner`,
          replyTo: "membership@rihoso.com",
        });
      })()
    );
  }
  tasks.push(
    sendNotification({
      subject: `Repair awarded: ${partner.business_name} — ${watch} (${formatUsd(quote.price_cents)}, fee ${formatUsd(fee)})`,
      rows: [
        ["Workshop", partner.business_name],
        ["Customer", `${req.contact_name ?? ""} · ${customerEmail ?? ""}`],
        ["Watch", watch],
        ["Price", formatUsd(quote.price_cents)],
        ["RIHOSO fee due", formatUsd(fee)],
        ["Admin", `${base}/marketplace/admin#repair-partners`],
      ],
      cc: ["membership@rihoso.com"],
    })
  );
  const results = await Promise.allSettled(tasks);
  results.forEach((r) => r.status === "rejected" && console.error("[partners] selection email failed", r.reason));
}

/** Partner: move a chosen job along (received → in progress → complete). */
export async function updateJob(userId: string, requestId: string, jobStatus: JobStatus, base: string) {
  const partner = await getPartnerForUser(userId);
  if (!partner) throw new UserError("Not a partner.");
  const admin = createAdminClient();
  const { data: q } = await admin
    .from("repair_quotes")
    .select(QUOTE_COLUMNS)
    .eq("request_id", requestId)
    .eq("partner_id", partner.id)
    .eq("status", "selected")
    .maybeSingle();
  const quote = q as RepairQuote | null;
  if (!quote) throw new UserError("This job isn't yours.");
  if (quote.job_status === "complete") throw new UserError("This job is already complete.");
  await admin.from("repair_quotes").update({ job_status: jobStatus }).eq("id", quote.id);
  const req = await getServiceRequest(requestId);
  if (!req) return;
  if (jobStatus === "complete") {
    await admin.from("service_requests").update({ status: "complete" }).eq("id", requestId);
    await sendNotification({
      subject: `Repair complete: ${partner.business_name} — ${repairWatchName(req)} (fee ${formatUsd(quote.fee_cents ?? 0)} due)`,
      rows: [
        ["Workshop", partner.business_name],
        ["Price", formatUsd(quote.price_cents ?? 0)],
        ["RIHOSO fee due", formatUsd(quote.fee_cents ?? 0)],
        ["Admin", `${base}/marketplace/admin#repair-partners`],
      ],
    }).catch(() => {});
  }
  const to = await getUserEmail(req.requester_id);
  if (to)
    await sendMemberEmail({
      to,
      subject: `Repair update: ${jobStatusLabel(jobStatus)}`,
      intro: `${partner.business_name} updated your ${repairWatchName(req) || "watch"} repair: ${jobStatusLabel(jobStatus).toLowerCase()}.`,
      ctaLabel: "View your request",
      ctaUrl: `${base}/marketplace/requests/${requestId}`,
      replyTo: "membership@rihoso.com",
    }).catch(() => {});
}

/** Admin: record that a workshop paid RIHOSO's referral fee (until fees are collected automatically). */
export async function markFeePaid(quoteId: string, paid: boolean) {
  await createAdminClient()
    .from("repair_quotes")
    .update({ fee_paid_at: paid ? new Date().toISOString() : null })
    .eq("id", quoteId)
    .eq("status", "selected");
}
