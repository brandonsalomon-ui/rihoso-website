// General donations to RIHOSO: any amount, paid by card on Stripe Checkout. No sign-in, no database table:
// Stripe is the record. The PaymentIntent's metadata marks a gift as "thanked" so the
// thank-you email and Brandon's notice go out once, whether the webhook or the thank-you page sees it first.

import "server-only";
import type Stripe from "stripe";
import { escapeHtml, sendNotification } from "@/lib/email";
import { getStripe } from "@/lib/stripe";

export const DONATION_MIN_CENTS = 500; // $5 — keeps card-testing bots from using the form for $1 probes
export const DONATION_MAX_CENTS = 2_500_000; // $25,000 — larger gifts by contacting the society
export const LEGAL_NAME = "Rhode Island Horological Society";
export const EIN = "92-1472556";

export function dollars(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

/** Turns "50", "$1,250.5" or 50 into cents. Returns null for anything else. */
export function parseAmountCents(value: unknown): number | null {
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value.replace(/[$,\s]/g, "") : "";
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(raw)) return null;
  return Math.round(Number(raw) * 100);
}

export async function startDonationCheckout(amountCents: number, base: string) {
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    submit_type: "donate",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: "Donation to the Rhode Island Horological Society",
            description: "Supports scholarships, education, and the work of the society. Thank you.",
          },
        },
      },
    ],
    payment_intent_data: {
      description: "RIHOSO general donation",
      metadata: { kind: "donation" },
    },
    metadata: { kind: "donation" },
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    success_url: `${base}/donate/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/#donate`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

export type Donation = { paid: boolean; amountCents: number; name: string; email: string };

/** Confirms a donation session and, the first time it's seen as paid, sends the thank-you and Brandon's notice. */
export async function finalizeDonationCheckout(sessionId: string): Promise<Donation | null> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["payment_intent.latest_charge"] });
  if (session.metadata?.kind !== "donation") return null;

  const pi = session.payment_intent as Stripe.PaymentIntent | null;
  const charge = (pi?.latest_charge ?? null) as Stripe.Charge | null;
  const donation: Donation = {
    paid: session.payment_status === "paid",
    amountCents: session.amount_total ?? 0,
    name: session.customer_details?.name || charge?.billing_details?.name || "",
    email: session.customer_details?.email || "",
  };
  if (!donation.paid || !pi || pi.metadata?.thanked === "1") return donation;

  // Mark first so a webhook arriving at the same moment as the thank-you page doesn't email twice.
  await stripe.paymentIntents.update(pi.id, { metadata: { ...pi.metadata, thanked: "1" } });

  await sendNotification({
    subject: `New donation: ${dollars(donation.amountCents)}${donation.name ? ` from ${donation.name}` : ""}`,
    replyTo: donation.email || undefined,
    rows: [
      ["Amount", dollars(donation.amountCents)],
      ["Name", donation.name],
      ["Email", donation.email],
      ["Stripe payment", pi.id],
    ],
  });
  if (donation.email) await sendThankYou(donation);
  return donation;
}

async function sendThankYou(d: Donation) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[donate] RESEND_API_KEY is not set — thank-you not sent");
    return;
  }
  const first = d.name.split(/\s+/)[0] || "friend";
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });
  const paragraphs = [
    `Dear ${first},`,
    `Thank you for your generous gift of ${dollars(d.amountCents)} to the ${LEGAL_NAME}. Every dollar goes toward our scholarships, our education programs for the next generation of watchmakers, and the work of keeping horology alive here in Rhode Island.`,
    `Please keep this email for your records: the ${LEGAL_NAME} (EIN ${EIN}) received your contribution of ${dollars(d.amountCents)} on ${date}. No goods or services were provided in exchange for this contribution.`,
    "We hope to see you at an upcoming gathering.",
    "With gratitude,\nBrandon Salomon\nFounder, Rhode Island Horological Society",
  ];
  const html = `
    <div style="font-family:Georgia,serif;color:#1a2e1a;max-width:560px">
      ${paragraphs.map((p) => `<p style="font-size:16px;white-space:pre-wrap">${escapeHtml(p)}</p>`).join("")}
      <p style="margin-top:24px;color:#666;font-size:12px">membership@rihoso.com · rihoso.com</p>
    </div>`;
  const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.WELCOME_FROM_EMAIL || '"Brandon Salomon, RIHOSO" <membership@rihoso.com>',
      to: [d.email],
      reply_to: "membership@rihoso.com",
      subject: "Thank you for your gift to RIHOSO",
      html,
      text: `${paragraphs.join("\n\n")}\n\nmembership@rihoso.com · rihoso.com`,
    }),
  });
  if (!res.ok) console.error("[donate] Resend error", res.status, await res.text().catch(() => ""));
}
