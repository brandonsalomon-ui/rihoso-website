import "server-only";
import crypto from "node:crypto";
import { brandonCopy, escapeHtml } from "@/lib/email";
import { EVENTS } from "@/lib/events";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The RIHOSO mailing list, built live from the database:
 *  - paid online memberships (memberships, status = paid)
 *  - members approved by hand (profiles.is_member, e.g. paid by check)
 *  - everyone with a rihoso.com account (auth users)
 *  - everyone who RSVP'd to an event (event_rsvps)
 * People are keyed by lower-case email, so one person appears once.
 */

export type PersonStatus = "active" | "approved" | "expired" | "account" | "rsvp";

export const STATUS_LABEL: Record<PersonStatus, string> = {
  active: "Member — paid online",
  approved: "Member — approved by hand",
  expired: "Membership ended",
  account: "Site account (not a member)",
  rsvp: "Event RSVP only",
};

export type Person = {
  /** Site account id (absent for RSVP-only people). */
  userId: string | null;
  email: string;
  name: string;
  phone: string;
  status: PersonStatus;
  /** First paid membership (members) or account creation / first RSVP (everyone else). */
  since: string | null;
  /** End of the latest paid online membership. */
  memberUntil: string | null;
  hasAccount: boolean;
  /** RSVP'd event slugs. */
  events: string[];
  unsubscribed: boolean;
};

export function isMember(p: Person) {
  return p.status === "active" || p.status === "approved";
}

export async function loadDirectory(): Promise<Person[]> {
  const admin = createAdminClient();

  const users: { id: string; email: string; created_at: string }[] = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) if (u.email) users.push({ id: u.id, email: u.email.toLowerCase(), created_at: u.created_at });
    if (data.users.length < 1000) break;
  }

  const [profilesRes, membershipsRes, rsvpsRes, unsubRes] = await Promise.all([
    admin.from("profiles").select("id, display_name, is_member"),
    admin.from("memberships").select("user_id, full_name, phone, paid_at, period_end").eq("status", "paid"),
    admin.from("event_rsvps").select("event_slug, full_name, email, phone, created_at"),
    admin.from("email_unsubscribes").select("email"),
  ]);
  if (profilesRes.error) throw profilesRes.error;
  if (membershipsRes.error) throw membershipsRes.error;
  if (rsvpsRes.error) throw rsvpsRes.error;
  // The unsubscribe table arrives with migration 0009; treat a missing table as "nobody unsubscribed".
  const unsubscribed = new Set((unsubRes.data ?? []).map((r) => (r.email as string).toLowerCase()));

  const profiles = new Map((profilesRes.data ?? []).map((p) => [p.id as string, p]));
  const now = Date.now();
  const people = new Map<string, Person>();

  type M = { user_id: string; full_name: string; phone: string | null; paid_at: string; period_end: string };
  const byUser = new Map<string, M[]>();
  for (const m of (membershipsRes.data ?? []) as M[]) {
    const list = byUser.get(m.user_id) ?? [];
    list.push(m);
    byUser.set(m.user_id, list);
  }

  for (const u of users) {
    const terms = (byUser.get(u.id) ?? []).sort((a, b) => a.paid_at.localeCompare(b.paid_at));
    const latest = terms.length ? terms.reduce((a, b) => (a.period_end > b.period_end ? a : b)) : null;
    const profile = profiles.get(u.id);
    const activeOnline = latest ? new Date(latest.period_end).getTime() > now : false;
    let status: PersonStatus = "account";
    if (activeOnline) status = "active";
    else if (profile?.is_member) status = "approved";
    else if (latest) status = "expired";
    const display = (profile?.display_name as string | undefined) ?? "";
    people.set(u.email, {
      userId: u.id,
      email: u.email,
      name: latest?.full_name || (display && display !== "Collector" ? display : ""),
      phone: latest?.phone ?? "",
      status,
      since: terms[0]?.paid_at ?? u.created_at,
      memberUntil: latest?.period_end ?? null,
      hasAccount: true,
      events: [],
      unsubscribed: unsubscribed.has(u.email),
    });
  }

  for (const r of (rsvpsRes.data ?? []) as { event_slug: string; full_name: string; email: string; phone: string | null; created_at: string }[]) {
    const email = r.email.toLowerCase();
    const p = people.get(email);
    if (p) {
      if (!p.events.includes(r.event_slug)) p.events.push(r.event_slug);
      if (!p.name) p.name = r.full_name;
      if (!p.phone && r.phone) p.phone = r.phone;
    } else {
      people.set(email, {
        userId: null,
        email,
        name: r.full_name,
        phone: r.phone ?? "",
        status: "rsvp",
        since: r.created_at,
        memberUntil: null,
        hasAccount: false,
        events: [r.event_slug],
        unsubscribed: unsubscribed.has(email),
      });
    }
  }

  const order: Record<PersonStatus, number> = { active: 0, approved: 0, expired: 1, account: 2, rsvp: 3 };
  return Array.from(people.values()).sort(
    (a, b) => order[a.status] - order[b.status] || (a.name || a.email).localeCompare(b.name || b.email)
  );
}

// ───────────────────────── audiences ─────────────────────────

export type Audience = { id: string; label: string; hint: string; match: (p: Person) => boolean };

export function audiences(): Audience[] {
  const list: Audience[] = [
    { id: "members", label: "Current members", hint: "Paid and active, plus anyone you approved by hand", match: isMember },
    {
      id: "members_all",
      label: "Current and past members",
      hint: "Adds people whose membership has ended — useful for renewal notes",
      match: (p) => isMember(p) || p.status === "expired",
    },
    { id: "everyone", label: "Everyone on the list", hint: "Members, site accounts and event RSVPs", match: () => true },
  ];
  for (const e of EVENTS) {
    if (!e.rsvp) continue;
    const slug = e.rsvp.slug;
    list.push({
      id: `rsvp:${slug}`,
      label: `RSVPs — ${e.shortTitle || e.title}`,
      hint: `Everyone who RSVP'd (${e.date})`,
      match: (p) => p.events.includes(slug),
    });
  }
  return list;
}

/** Who an announcement to this audience reaches. Unsubscribed people are always left out. */
export function recipients(people: Person[], audienceId: string) {
  const audience = audiences().find((a) => a.id === audienceId);
  if (!audience) return null;
  const matched = people.filter(audience.match);
  return {
    audience,
    to: matched.filter((p) => !p.unsubscribed),
    skipped: matched.filter((p) => p.unsubscribed).length,
  };
}

// ───────────────────────── unsubscribe links ─────────────────────────

function mailSecret() {
  const secret = process.env.MAIL_SIGNING_SECRET || process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("No signing secret configured for unsubscribe links");
  return secret;
}

function sign(email: string) {
  return crypto.createHmac("sha256", mailSecret()).update(`unsubscribe:${email}`).digest("base64url").slice(0, 32);
}

export function unsubscribeParams(email: string) {
  const e = Buffer.from(email.toLowerCase()).toString("base64url");
  return `e=${e}&t=${sign(email.toLowerCase())}`;
}

/** The email address an unsubscribe link belongs to, or null if the link was altered. */
export function verifyUnsubscribe(e: string | null, t: string | null) {
  if (!e || !t) return null;
  let email: string;
  try {
    email = Buffer.from(e, "base64url").toString("utf8").toLowerCase();
  } catch {
    return null;
  }
  if (!email.includes("@") || email.length > 200) return null;
  const expected = Buffer.from(sign(email));
  const given = Buffer.from(t);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given) ? email : null;
}

export async function unsubscribe(email: string) {
  const { error } = await createAdminClient()
    .from("email_unsubscribes")
    .upsert({ email: email.toLowerCase() }, { onConflict: "email", ignoreDuplicates: true });
  if (error) throw error;
}

// ───────────────────────── composing ─────────────────────────

export type Message = { subject: string; body: string; ctaLabel?: string; ctaUrl?: string };

export const FROM = () => process.env.MEMBER_MAIL_FROM || "RIHOSO <membership@rihoso.com>";
export const REPLY_TO = () => process.env.MEMBER_MAIL_REPLY_TO || "membership@rihoso.com";
export const POSTAL = () =>
  process.env.MAIL_POSTAL_ADDRESS || "Rhode Island Horological Society · 651 Putnam Pike, Greenville, RI 02828";

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "friend";
}

/** Blank lines start a new paragraph; single line breaks are kept; web links become clickable. */
function paragraphsHtml(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const html = escapeHtml(p)
        .replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)"'])/g, '<a href="$1" style="color:#8a6d1f">$1</a>')
        .replace(/\n/g, "<br/>");
      return `<p style="font-size:16px;line-height:1.6;margin:0 0 16px">${html}</p>`;
    })
    .join("");
}

export function renderEmail(msg: Message, person: { email: string; name: string }, base: string) {
  const body = msg.body.replace(/\{first_name\}/gi, firstName(person.name));
  const unsubUrl = `${base}/unsubscribe?${unsubscribeParams(person.email)}`;
  const cta =
    msg.ctaLabel && msg.ctaUrl
      ? `<p style="margin:8px 0 24px"><a href="${escapeHtml(msg.ctaUrl)}" style="display:inline-block;background:#c9a84c;color:#0f1d0f;padding:12px 22px;text-decoration:none;border-radius:4px;font-family:Georgia,serif">${escapeHtml(msg.ctaLabel)}</a></p>`
      : "";
  const html = `
<div style="background:#f5f0e8;padding:24px 12px">
  <div style="max-width:580px;margin:0 auto;background:#ffffff;border-top:4px solid #1a2e1a;font-family:Georgia,serif;color:#1a2e1a">
    <div style="padding:24px 28px 8px;text-align:center">
      <div style="font-size:22px;letter-spacing:4px;font-weight:bold">RIHOSO</div>
      <div style="font-size:11px;letter-spacing:2px;color:#8a6d1f;text-transform:uppercase">Rhode Island Horological Society</div>
    </div>
    <div style="padding:16px 28px 8px">
      ${paragraphsHtml(body)}
      ${cta}
    </div>
    <div style="padding:16px 28px 24px;border-top:1px solid #e8e0d0;font-size:12px;color:#777;line-height:1.5">
      Questions? Just reply to this email.<br/>
      ${escapeHtml(POSTAL())}<br/>
      <a href="${escapeHtml(unsubUrl)}" style="color:#777">Unsubscribe</a> from RIHOSO announcements.
    </div>
  </div>
</div>`;
  const text = `${body.trim()}\n\n${msg.ctaLabel && msg.ctaUrl ? `${msg.ctaLabel}: ${msg.ctaUrl}\n\n` : ""}—\nRhode Island Horological Society\n${POSTAL()}\nUnsubscribe: ${unsubUrl}`;
  return {
    from: FROM(),
    to: [person.email],
    reply_to: REPLY_TO(),
    subject: msg.subject,
    html,
    text,
    headers: {
      "List-Unsubscribe": `<${base}/api/unsubscribe?${unsubscribeParams(person.email)}>, <mailto:${REPLY_TO()}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

/**
 * A personal note to one person (e.g. a follow-up), written as a plain letter from Brandon:
 * no banner and no unsubscribe footer. Brandon gets a blind copy.
 */
export function renderPersonal(msg: Message, person: { email: string; name: string }) {
  const body = msg.body.replace(/\{first_name\}/gi, firstName(person.name));
  const cta =
    msg.ctaLabel && msg.ctaUrl
      ? `<p style="margin:8px 0 18px"><a href="${escapeHtml(msg.ctaUrl)}" style="display:inline-block;background:#c9a84c;color:#0f1d0f;padding:10px 18px;text-decoration:none;border-radius:4px">${escapeHtml(msg.ctaLabel)}</a></p>`
      : "";
  return {
    from: process.env.WELCOME_FROM_EMAIL || '"Brandon Salomon, RIHOSO" <membership@rihoso.com>',
    to: [person.email],
    bcc: brandonCopy(),
    reply_to: REPLY_TO(),
    subject: msg.subject,
    html: `<div style="font-family:Georgia,serif;color:#1a2e1a;max-width:580px">${paragraphsHtml(body)}${cta}</div>`,
    text: `${body.trim()}${msg.ctaLabel && msg.ctaUrl ? `\n\n${msg.ctaLabel}: ${msg.ctaUrl}` : ""}`,
  };
}

// ───────────────────────── sending ─────────────────────────

const RESEND = () => (process.env.RESEND_API_URL || "https://api.resend.com/emails").replace(/\/emails\/?$/, "");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Sends one email per person (never CC/BCC), 100 at a time through Resend's batch API.
 * Returns each person's Resend id or error.
 */
export async function sendEach(emails: { to: string[] }[]) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  const results: { email: string; id?: string; error?: string }[] = [];
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100);
    if (i > 0) await sleep(700); // stay under Resend's request rate limit
    let res: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(`${RESEND()}/emails/batch`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(chunk),
      });
      if (res.status !== 429) break;
      await sleep(1500 * (attempt + 1));
    }
    if (!res || !res.ok) {
      const detail = res ? `${res.status} ${(await res.text().catch(() => "")).slice(0, 300)}` : "no response";
      console.error("[member-mail] Resend batch error", detail);
      for (const e of chunk) results.push({ email: e.to[0], error: `Email service error (${detail.slice(0, 120)})` });
      continue;
    }
    const json = (await res.json().catch(() => ({}))) as { data?: { id: string }[] };
    chunk.forEach((e, j) => results.push({ email: e.to[0], id: json.data?.[j]?.id }));
  }
  return results;
}
