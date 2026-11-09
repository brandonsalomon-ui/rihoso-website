import "server-only";
import crypto from "node:crypto";
import { brandonCopy, EMAIL_RE, escapeHtml, sendNotification } from "@/lib/email";
import { CLINIC_PRICE, dollars, isOccasion, occasionLabel, priceGuests, TBD } from "@/lib/clinic";
import { UserError } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/* ───────────────────────── member codes ───────────────────────── */

const CODE_TTL_MINUTES = 15;
const CODE_MAX_ATTEMPTS = 5;
/** How long a verified member stays verified for checkout. */
const VERIFIED_FOR_HOURS = 3;
const RESEND_AFTER_SECONDS = 60;
const MAX_CODES_PER_EMAIL_PER_HOUR = 5;
const MAX_CODES_PER_HOUR = 60;

function codeKey() {
  return crypto
    .createHash("sha256")
    .update(`rihoso-clinic-code:${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`)
    .digest();
}

function hashCode(codeId: string, email: string, code: string) {
  return crypto.createHmac("sha256", codeKey()).update(`${codeId}|${email}|${code}`).digest("base64url");
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function isMemberEmail(email: string) {
  const { data, error } = await createAdminClient().rpc("is_member_email", { p_email: email });
  if (error) throw error;
  return data === true;
}

async function sendEmail({
  to,
  subject,
  paragraphs,
  table = [],
  bcc = [],
}: {
  to: string;
  subject: string;
  paragraphs: string[];
  table?: [string, string][];
  bcc?: string[];
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[clinic] RESEND_API_KEY is not set — email not sent", { subject });
    return { ok: false as const };
  }
  const [first, ...rest] = paragraphs;
  const tableHtml = table.length
    ? `<table style="border-collapse:collapse;margin:16px 0;border-left:3px solid #c9a84c;background:#f5f0e8">${table
        .map(
          ([k, v]) =>
            `<tr><td style="padding:6px 16px;font-weight:bold;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:6px 16px;white-space:pre-wrap">${escapeHtml(v || "—")}</td></tr>`
        )
        .join("")}</table>`
    : "";
  const html = `
    <div style="font-family:Georgia,serif;color:#1a2e1a;max-width:560px">
      <p style="font-size:16px">${escapeHtml(first)}</p>
      ${tableHtml}
      ${rest.map((p) => `<p style="font-size:16px;white-space:pre-wrap">${escapeHtml(p)}</p>`).join("")}
      <p style="margin-top:24px;color:#666;font-size:12px">rihoso.com · info@rihoso.com</p>
    </div>`;
  const text = [first, table.map(([k, v]) => `${k}: ${v || "—"}`).join("\n"), ...rest, "rihoso.com · info@rihoso.com"]
    .filter(Boolean)
    .join("\n\n");
  const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.FORM_FROM_EMAIL || "RIHOSO <website@rihoso.com>",
      to: [to],
      ...(bcc.length ? { bcc } : {}),
      reply_to: "info@rihoso.com",
      subject,
      html,
      text,
    }),
  });
  if (!res.ok) console.error("[clinic] Resend error", res.status, await res.text().catch(() => ""));
  return { ok: res.ok };
}

/** Emails a 6-digit code to a member guest. Returns the code's id, which the form sends back with the code. */
export async function sendMemberCode(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  if (!EMAIL_RE.test(email) || email.length > 200) throw new UserError("Please enter the member's email address.");

  const admin = createAdminClient();
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const [{ data: recent }, { count: globalCount }] = await Promise.all([
    admin.from("clinic_member_codes").select("created_at").eq("email", email).gte("created_at", hourAgo).order("created_at", { ascending: false }),
    admin.from("clinic_member_codes").select("id", { count: "exact", head: true }).gte("created_at", hourAgo),
  ]);
  const last = recent?.[0]?.created_at as string | undefined;
  if (last && Date.now() - new Date(last).getTime() < RESEND_AFTER_SECONDS * 1000) {
    throw new UserError("A code was just sent to that email. Please wait a minute before asking for another.");
  }
  if ((recent?.length ?? 0) >= MAX_CODES_PER_EMAIL_PER_HOUR || (globalCount ?? 0) >= MAX_CODES_PER_HOUR) {
    throw new UserError("Too many codes requested. Please try again later, or email info@rihoso.com.");
  }

  if (!(await isMemberEmail(email))) {
    throw new UserError(
      "We couldn't find an active RIHOSO membership for that email. Use the email the member signed up with, or book this guest at the standard rate."
    );
  }

  const id = crypto.randomUUID();
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  const { error } = await admin.from("clinic_member_codes").insert({
    id,
    email,
    code_hash: hashCode(id, email, code),
    expires_at: new Date(Date.now() + CODE_TTL_MINUTES * 60_000).toISOString(),
  });
  if (error) throw error;

  const sent = await sendEmail({
    to: email,
    subject: `Your RIHOSO member code: ${code}`,
    paragraphs: [
      `Your RIHOSO member code is ${code}.`,
      `Someone is booking a RIHOSO Watchmaking Clinic and listed you as a member guest, so you get the $${CLINIC_PRICE.memberCents / 100} member rate. Share this code with them, or enter it yourself if you're the one booking. It expires in ${CODE_TTL_MINUTES} minutes.`,
      "If you weren't expecting this, you can ignore this email — nothing happens without the code.",
    ],
  });
  if (!sent.ok) throw new Error("Couldn't send the member code email");
  return { codeId: id };
}

/** Checks a member code. On success the code row is marked verified and can be used at checkout. */
export async function verifyMemberCode(codeId: string, rawEmail: string, rawCode: string) {
  const email = normalizeEmail(rawEmail);
  const code = rawCode.replace(/\D/g, "");
  if (!/^[0-9a-f-]{36}$/i.test(codeId) || code.length !== 6) throw new UserError("Please enter the 6-digit code.");

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("clinic_member_codes")
    .select("id, email, code_hash, attempts, expires_at, verified_at")
    .eq("id", codeId)
    .maybeSingle();
  if (!row || row.email !== email) throw new UserError("That code doesn't match. Please request a new one.");
  if (row.verified_at) return { ok: true };
  if (new Date(row.expires_at as string) < new Date()) throw new UserError("That code has expired. Please request a new one.");
  if ((row.attempts as number) >= CODE_MAX_ATTEMPTS) throw new UserError("Too many tries. Please request a new code.");

  await admin.from("clinic_member_codes").update({ attempts: (row.attempts as number) + 1 }).eq("id", row.id);
  const expected = Buffer.from(row.code_hash as string);
  const given = Buffer.from(hashCode(row.id as string, email, code));
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
    throw new UserError("That code isn't right. Please check the email and try again.");
  }
  await admin.from("clinic_member_codes").update({ verified_at: new Date().toISOString() }).eq("id", row.id);
  return { ok: true };
}

/* ───────────────────────── bookings ───────────────────────── */

export type GuestInput = { name: string; member: boolean; memberEmail?: string; codeId?: string };

export type BookingInput = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  locationNotes: string;
  occasion: string;
  occasionDetails: string;
  notes: string;
  guests: GuestInput[];
};

type StoredGuest = { name: string; member: boolean; member_email: string | null; price_cents: number };

export type ClinicBooking = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  location_notes: string | null;
  occasion: string | null;
  occasion_details: string | null;
  notes: string | null;
  guests: StoredGuest[];
  seats: number;
  member_seats: number;
  amount_cents: number;
  status: "pending" | "paid" | "cancelled" | "refunded";
  stripe_checkout_session_id: string | null;
  paid_at: string | null;
  created_at: string;
};

const COLUMNS =
  "id, full_name, email, phone, location, location_notes, occasion, occasion_details, notes, guests, seats, member_seats, amount_cents, status, stripe_checkout_session_id, paid_at, created_at";

/** Validates the form, re-checks every member guest, saves the booking and opens Stripe Checkout. */
export async function startClinicCheckout(input: BookingInput, base: string) {
  const email = normalizeEmail(input.email);
  if (!input.fullName) throw new UserError("Please enter your name.");
  if (!EMAIL_RE.test(email)) throw new UserError("Please enter a valid email address.");
  if (input.phone.replace(/\D/g, "").length < 7) throw new UserError("Please enter a valid phone number.");
  if (!input.location) throw new UserError("Please tell us where you'd like to hold the clinic.");
  if (input.occasion && !isOccasion(input.occasion)) throw new UserError("Please choose an occasion from the list.");
  if (input.occasion === "other" && !input.occasionDetails) throw new UserError("Please describe the occasion.");
  if (input.guests.length > CLINIC_PRICE.maximumSeats) {
    throw new UserError(`For groups over ${CLINIC_PRICE.maximumSeats}, please send an inquiry and we'll plan it with you.`);
  }

  // Pad the list up to the minimum with TBD seats.
  const guests: GuestInput[] = input.guests.map((g) => ({ ...g, name: g.name || TBD }));
  while (guests.length < CLINIC_PRICE.minimumSeats) guests.push({ name: TBD, member: false });

  const admin = createAdminClient();
  const seen = new Set<string>();
  const stored: StoredGuest[] = [];
  for (const g of guests) {
    if (!g.member) {
      stored.push({ name: g.name, member: false, member_email: null, price_cents: CLINIC_PRICE.standardCents });
      continue;
    }
    const memberEmail = normalizeEmail(g.memberEmail ?? "");
    if (g.name === TBD) throw new UserError("Please enter the name of each member guest.");
    if (!memberEmail || !g.codeId) throw new UserError(`Please verify ${g.name}'s membership, or untick "RIHOSO member".`);
    if (seen.has(memberEmail)) throw new UserError("Each member can only be used for one seat.");
    seen.add(memberEmail);
    const { data: code } = await admin
      .from("clinic_member_codes")
      .select("email, verified_at")
      .eq("id", g.codeId)
      .maybeSingle();
    const verifiedAt = code?.verified_at ? new Date(code.verified_at as string).getTime() : 0;
    if (!code || code.email !== memberEmail || !verifiedAt || Date.now() - verifiedAt > VERIFIED_FOR_HOURS * 3600_000) {
      throw new UserError(`${g.name}'s member check has expired. Please verify the membership again.`);
    }
    if (!(await isMemberEmail(memberEmail))) throw new UserError(`${g.name} is no longer an active member.`);
    stored.push({ name: g.name, member: true, member_email: memberEmail, price_cents: CLINIC_PRICE.memberCents });
  }

  const price = priceGuests(stored);
  const { data: row, error } = await admin
    .from("clinic_bookings")
    .insert({
      full_name: input.fullName,
      email,
      phone: input.phone,
      location: input.location,
      location_notes: input.locationNotes || null,
      occasion: input.occasion || null,
      occasion_details: input.occasion === "other" ? input.occasionDetails : input.occasionDetails || null,
      notes: input.notes || null,
      guests: stored,
      seats: price.seats,
      member_seats: price.memberSeats,
      amount_cents: price.totalCents,
    })
    .select("id")
    .single();
  if (error) throw error;

  const lineItems = [];
  if (price.standardSeats > 0) {
    lineItems.push({
      quantity: price.standardSeats,
      price_data: {
        currency: "usd",
        unit_amount: CLINIC_PRICE.standardCents,
        product_data: { name: "Watchmaking Clinic — seat" },
      },
    });
  }
  if (price.memberSeats > 0) {
    lineItems.push({
      quantity: price.memberSeats,
      price_data: {
        currency: "usd",
        unit_amount: CLINIC_PRICE.memberCents,
        product_data: { name: "Watchmaking Clinic — RIHOSO member seat" },
      },
    });
  }

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: lineItems,
    payment_intent_data: {
      description: `RIHOSO Watchmaking Clinic — ${input.fullName} (${price.seats} seats)`,
      metadata: { kind: "clinic", booking_id: row.id },
    },
    metadata: { kind: "clinic", booking_id: row.id },
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    success_url: `${base}/watchmaking-clinic/booked?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/watchmaking-clinic?payment=cancelled#book`,
  });
  await admin.from("clinic_bookings").update({ stripe_checkout_session_id: session.id }).eq("id", row.id);
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { url: session.url };
}

function guestLines(guests: StoredGuest[], withEmails = false) {
  return guests
    .map((g, i) => {
      const who = g.member ? `RIHOSO member${withEmails ? ` (${g.member_email})` : ""}` : "";
      return `${i + 1}. ${g.name}${who ? ` — ${who}` : ""} — ${dollars(g.price_cents)}`;
    })
    .join("\n");
}

/** Confirms a paid clinic checkout. Safe to call more than once (webhook and the thank-you page). */
export async function finalizeClinicCheckout(sessionId: string) {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.metadata?.kind !== "clinic" || !session.metadata.booking_id) return null;
  const admin = createAdminClient();
  const { data: existing } = await admin.from("clinic_bookings").select(COLUMNS).eq("id", session.metadata.booking_id).maybeSingle();
  const row = existing as ClinicBooking | null;
  if (!row || row.status !== "pending" || session.payment_status !== "paid") return row;

  const { data: updated } = await admin
    .from("clinic_bookings")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
    })
    .eq("id", row.id)
    .eq("status", "pending")
    .select(COLUMNS)
    .maybeSingle();
  if (!updated) {
    const { data: again } = await admin.from("clinic_bookings").select(COLUMNS).eq("id", row.id).maybeSingle();
    return again as ClinicBooking | null;
  }
  const b = updated as ClinicBooking;
  const occasion = b.occasion ? `${occasionLabel(b.occasion)}${b.occasion_details ? ` — ${b.occasion_details}` : ""}` : "Not a special occasion";

  await sendNotification({
    subject: `Watchmaking Clinic booked & paid: ${b.full_name} (${b.seats} seats)`,
    replyTo: b.email,
    rows: [
      ["Name", b.full_name],
      ["Email", b.email],
      ["Phone", b.phone],
      ["Paid", `${dollars(b.amount_cents)} — ${b.seats} seats (${b.member_seats} member)`],
      ["Location", b.location],
      ["Location notes", b.location_notes ?? ""],
      ["Occasion", occasion],
      ["Notes", b.notes ?? ""],
      ["Guests", guestLines(b.guests, true)],
      ["Stripe payment", b.stripe_checkout_session_id ?? ""],
    ],
  });

  const first = b.full_name.split(/\s+/)[0] || b.full_name;
  await sendEmail({
    to: b.email,
    bcc: brandonCopy(),
    subject: "Your RIHOSO Watchmaking Clinic is booked",
    paragraphs: [
      `Dear ${first}, thank you — your Watchmaking Clinic is booked and paid.`,
      "We'll be in touch shortly by email or phone to set the date and introduce your watchmaker. Guest names marked TBD can be updated any time before the clinic — just reply to this email.",
      "With warm regards,\nThe Rhode Island Horological Society",
    ],
    table: [
      ["Paid", `${dollars(b.amount_cents)} for ${b.seats} seats`],
      ["Location", b.location],
      ["Occasion", occasion],
      ["Guests", guestLines(b.guests)],
    ],
  });
  return b;
}
