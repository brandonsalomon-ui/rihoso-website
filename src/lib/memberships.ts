import "server-only";
import { sendMemberEmail, sendNotification } from "@/lib/email";
import { formatUsd } from "@/lib/marketplace";
import { MEMBERSHIP_PRICE_CENTS, MEMBERSHIP_TERM_MONTHS } from "@/lib/membership";
import { UserError } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";
import { createAdminClient, getUserEmail } from "@/lib/supabase/admin";

export type Membership = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  amount_cents: number;
  status: "pending" | "paid" | "refunded";
  stripe_checkout_session_id: string | null;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  created_at: string;
};

const COLUMNS =
  "id, user_id, full_name, phone, amount_cents, status, stripe_checkout_session_id, period_start, period_end, paid_at, created_at";

/** Days before the end of a term that the renewal reminder goes out. */
export const REMINDER_DAYS = 14;

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { timeZone: "America/New_York", dateStyle: "long" });
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

/** The latest end date of this person's paid memberships, if any. */
export async function currentMembershipEnd(userId: string) {
  const { data } = await createAdminClient()
    .from("memberships")
    .select("period_end")
    .eq("user_id", userId)
    .eq("status", "paid")
    .order("period_end", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.period_end as string | undefined) ?? null;
}

/** Records the sign-up and opens Stripe Checkout for $120. */
export async function startMembershipCheckout(userId: string, fullName: string, phone: string, base: string) {
  if (!fullName) throw new UserError("Please enter your name.");
  const admin = createAdminClient();
  const email = await getUserEmail(userId);

  const { data: row, error } = await admin
    .from("memberships")
    .insert({ user_id: userId, full_name: fullName, phone: phone || null, amount_cents: MEMBERSHIP_PRICE_CENTS })
    .select("id")
    .single();
  if (error) throw error;

  const currentEnd = await currentMembershipEnd(userId);
  const renewing = currentEnd && new Date(currentEnd) > new Date();
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: email ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: MEMBERSHIP_PRICE_CENTS,
          product_data: {
            name: `RIHOSO Membership — ${MEMBERSHIP_TERM_MONTHS} months`,
            description: renewing
              ? `Renewal: adds ${MEMBERSHIP_TERM_MONTHS} months after ${formatDate(currentEnd)}. Does not renew automatically.`
              : `Starts today. Does not renew automatically.`,
          },
        },
      },
    ],
    payment_intent_data: {
      description: `RIHOSO Membership — ${fullName}`,
      metadata: { kind: "membership", membership_id: row.id },
    },
    metadata: { kind: "membership", membership_id: row.id },
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    success_url: `${base}/memberships/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/memberships#join`,
  });
  await admin.from("memberships").update({ stripe_checkout_session_id: session.id }).eq("id", row.id);
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

/**
 * Confirms a paid membership checkout. Safe to call more than once (webhook, welcome page, daily job).
 * The term starts now, or when the member's current term ends if they renew early.
 */
export async function finalizeMembershipCheckout(sessionId: string, base: string) {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.metadata?.kind !== "membership") return null;
  const id = session.metadata.membership_id;
  if (!id) return null;
  const admin = createAdminClient();
  const { data: existing } = await admin.from("memberships").select(COLUMNS).eq("id", id).maybeSingle();
  const row = existing as Membership | null;
  if (!row || row.status !== "pending" || session.payment_status !== "paid") return row;

  const now = new Date();
  const currentEnd = await currentMembershipEnd(row.user_id);
  const start = currentEnd && new Date(currentEnd) > now ? new Date(currentEnd) : now;
  const end = addMonths(start, MEMBERSHIP_TERM_MONTHS);

  const { data: updated } = await admin
    .from("memberships")
    .update({
      status: "paid",
      paid_at: now.toISOString(),
      period_start: start.toISOString(),
      period_end: end.toISOString(),
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
    })
    .eq("id", row.id)
    .eq("status", "pending")
    .select(COLUMNS)
    .maybeSingle();
  if (!updated) {
    // Another call confirmed it first.
    const { data: again } = await admin.from("memberships").select(COLUMNS).eq("id", row.id).maybeSingle();
    return again as Membership | null;
  }

  await admin.from("profiles").update({ is_member: true }).eq("id", row.user_id);

  const email = await getUserEmail(row.user_id);
  await sendNotification({
    subject: `New RIHOSO member: ${row.full_name}`,
    replyTo: email ?? undefined,
    rows: [
      ["Name", row.full_name],
      ["Email", email ?? ""],
      ["Phone", row.phone ?? ""],
      ["Paid", formatUsd(row.amount_cents)],
      ["Member until", formatDate(end.toISOString())],
      ["Admin", `${base}/marketplace/admin`],
    ],
  });
  if (email) {
    await sendMemberEmail({
      to: email,
      subject: "Welcome to the Rhode Island Horological Society",
      intro: `Thank you, ${row.full_name}. Your RIHOSO membership is active until ${formatDate(end.toISOString())}. It does not renew automatically — we'll email you before it ends. Your Watch Exchange selling fee is now 5%.`,
      ctaLabel: "Your account",
      ctaUrl: `${base}/marketplace/account`,
    });
  }
  return updated as Membership;
}

/**
 * Daily housekeeping:
 *  - emails a renewal reminder REMINDER_DAYS before a term ends
 *  - removes the member fee rate from people whose online membership has ended
 */
export async function runMembershipHousekeeping(base: string) {
  const admin = createAdminClient();
  const now = new Date();
  const reminders: string[] = [];
  const expired: string[] = [];

  // Reminders: terms ending within REMINDER_DAYS that haven't been reminded, unless already renewed.
  const { data: ending } = await admin
    .from("memberships")
    .select("id, user_id, full_name, period_end")
    .eq("status", "paid")
    .is("reminder_sent_at", null)
    .gt("period_end", now.toISOString())
    .lte("period_end", new Date(now.getTime() + REMINDER_DAYS * 86400000).toISOString())
    .limit(100);
  for (const m of ending ?? []) {
    const latest = await currentMembershipEnd(m.user_id as string);
    if (latest && new Date(latest) > new Date(m.period_end as string)) {
      await admin.from("memberships").update({ reminder_sent_at: now.toISOString() }).eq("id", m.id);
      continue; // already renewed
    }
    const email = await getUserEmail(m.user_id as string);
    if (email) {
      await sendMemberEmail({
        to: email,
        subject: "Your RIHOSO membership ends soon",
        intro: `Hi ${m.full_name}, your RIHOSO membership ends on ${formatDate(m.period_end as string)}. Renew for another ${MEMBERSHIP_TERM_MONTHS} months (${formatUsd(MEMBERSHIP_PRICE_CENTS)}) to keep your member benefits and the 5% Watch Exchange fee. Renewing early adds the time to the end of your current term.`,
        ctaLabel: "Renew membership",
        ctaUrl: `${base}/memberships#join`,
      });
    }
    await admin.from("memberships").update({ reminder_sent_at: now.toISOString() }).eq("id", m.id);
    reminders.push(m.id as string);
  }

  // Expiry: people currently marked as members whose online memberships have all ended.
  const { data: lapsed } = await admin
    .from("memberships")
    .select("user_id, profiles!inner(is_member)")
    .eq("status", "paid")
    .lte("period_end", now.toISOString())
    .eq("profiles.is_member", true)
    .limit(200);
  const userIds = Array.from(new Set((lapsed ?? []).map((r) => r.user_id as string)));
  for (const userId of userIds) {
    const latest = await currentMembershipEnd(userId);
    if (latest && new Date(latest) > now) continue; // has a later, active term
    await admin.from("profiles").update({ is_member: false }).eq("id", userId);
    expired.push(userId);
  }
  return { reminders, expired };
}
