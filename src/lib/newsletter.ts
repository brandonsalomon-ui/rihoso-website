import "server-only";
import crypto from "node:crypto";
import { brandonCopy, escapeHtml, sendNotification } from "@/lib/email";
import { todayInRI } from "@/lib/events";
import { FROM, POSTAL, REPLY_TO, firstName, isMember, loadDirectory, newsletterGuestParams, sendEach, unsubscribeParams } from "@/lib/member-mail";
import {
  GROUP_LABEL,
  PHOTO_BUCKET,
  SECTIONS,
  issueMonthLabel,
  sectionDef,
  type NewsletterPhoto,
  type NewsletterSection,
  type NewsletterSource,
  type SectionKey,
} from "@/lib/newsletter-sections";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/config";

export type NewsletterStatus = "draft" | "approved" | "sending" | "sent" | "cancelled";

export type Newsletter = {
  id: string;
  slug: string;
  issue_date: string;
  title: string;
  intro: string;
  sections: NewsletterSection[];
  status: NewsletterStatus;
  approved_at: string | null;
  sent_at: string | null;
  campaign_id: string | null;
  created_by: "admin" | "writer";
  edited_at: string | null;
  notified_at: string | null;
  nudged_at: string | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  "id, slug, issue_date, title, intro, sections, status, approved_at, sent_at, campaign_id, created_by, edited_at, notified_at, nudged_at, created_at, updated_at";

export const NEWSLETTER_NAME = "The RIHOSO Monthly";

export function newsletterPhotoUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

// ───────────────────────── reading ─────────────────────────

function hydrate(row: Record<string, unknown>): Newsletter {
  const n = row as unknown as Newsletter;
  return { ...n, sections: orderSections(Array.isArray(n.sections) ? n.sections : []) };
}

/** Sections in the canonical order, unknown keys dropped. */
export function orderSections(list: NewsletterSection[]) {
  const byKey = new Map(list.map((s) => [s.key, s]));
  return SECTIONS.map((d) => byKey.get(d.key)).filter(Boolean) as NewsletterSection[];
}

export async function getIssueBySlug(slug: string) {
  if (!isSupabaseConfigured() || !/^\d{4}-\d{2}$/.test(slug)) return null;
  const { data } = await createAdminClient().from("newsletters").select(COLUMNS).eq("slug", slug).maybeSingle();
  return data ? hydrate(data) : null;
}

export async function getIssue(id: string) {
  const { data } = await createAdminClient().from("newsletters").select(COLUMNS).eq("id", id).maybeSingle();
  return data ? hydrate(data) : null;
}

/** Sent issues, newest first (what members see in the archive). */
export async function listSentIssues(limit = 36) {
  if (!isSupabaseConfigured()) return [] as Newsletter[];
  const { data } = await createAdminClient()
    .from("newsletters")
    .select(COLUMNS)
    .eq("status", "sent")
    .order("issue_date", { ascending: false })
    .limit(limit);
  return (data ?? []).map(hydrate);
}

export async function listAllIssues(limit = 36) {
  const { data } = await createAdminClient().from("newsletters").select(COLUMNS).order("issue_date", { ascending: false }).limit(limit);
  return (data ?? []).map(hydrate);
}

/** Paid and active online, or approved by hand. */
export async function isActiveMember(userId: string) {
  const admin = createAdminClient();
  const [profile, terms] = await Promise.all([
    admin.from("profiles").select("is_member").eq("id", userId).maybeSingle(),
    admin
      .from("memberships")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "paid")
      .gt("period_end", new Date().toISOString())
      .limit(1),
  ]);
  return Boolean(profile.data?.is_member) || Boolean(terms.data?.length);
}

// ───────────────────────── validating ─────────────────────────

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").trim().slice(0, max) : "");

export function firstOfMonth(issueDate: string) {
  return /^\d{4}-\d{2}-01$/.test(issueDate);
}

/** Bracketed placeholders like [who attended] that Brandon still needs to fill in. */
export function findPlaceholders(text: string) {
  return Array.from(text.matchAll(/\[([^\]\n]{2,80})\](?!\()/g)).map((m) => m[1]);
}

type CleanOptions = { strict: boolean; previous?: NewsletterSection[] };

/**
 * Cleans an incoming list of sections. `strict` (the writer's submission) requires every section with
 * enough text and sources; the admin editor only needs well-formed values. Photos are never taken
 * from the writer: they are kept from `previous` (the stored issue) and managed on the admin page.
 */
export function cleanSections(input: unknown, opts: CleanOptions) {
  const problems: string[] = [];
  const list = Array.isArray(input) ? input : [];
  const prev = new Map((opts.previous ?? []).map((s) => [s.key, s]));
  const out: NewsletterSection[] = [];
  for (const def of SECTIONS) {
    const raw = list.find((s) => (s as Record<string, unknown>)?.key === def.key) as Record<string, unknown> | undefined;
    if (!raw) {
      if (opts.strict) problems.push(`section "${def.key}" is missing`);
      const keep = prev.get(def.key);
      if (keep) out.push(keep);
      continue;
    }
    const title = str(raw.title, 140);
    const blurb = str(raw.blurb, 400);
    const body = str(raw.body, 14000);
    const sources: NewsletterSource[] = (Array.isArray(raw.sources) ? raw.sources : [])
      .map((s) => ({ title: str((s as Record<string, unknown>)?.title, 200), url: str((s as Record<string, unknown>)?.url, 500) }))
      .filter((s) => s.title && /^https:\/\/[^\s]+$/.test(s.url))
      .slice(0, 20);
    const photos: NewsletterPhoto[] = opts.strict
      ? prev.get(def.key)?.photos ?? []
      : (Array.isArray(raw.photos) ? raw.photos : [])
          .map((p) => ({
            path: str((p as Record<string, unknown>)?.path, 300),
            caption: str((p as Record<string, unknown>)?.caption, 200),
            credit: str((p as Record<string, unknown>)?.credit, 120),
          }))
          .filter((p) => /^[a-z0-9-]+\/[A-Za-z0-9._-]+$/.test(p.path))
          .slice(0, def.photos);

    if (/<\s*\/?\s*[a-z]/i.test(body) || /<\s*\/?\s*[a-z]/i.test(blurb)) problems.push(`${def.key}: plain Markdown only, no HTML`);
    if (opts.strict) {
      if (title.length < 2) problems.push(`${def.key}: title is required`);
      if (blurb.length < 20) problems.push(`${def.key}: blurb must be at least 20 characters`);
      if (body.length < def.minBody) problems.push(`${def.key}: body must be at least ${def.minBody} characters`);
      const need = def.key === "releases" || def.key === "news" || def.key === "world_events" ? 2 : def.sourced ? 1 : 0;
      if (sources.length < need) problems.push(`${def.key}: needs at least ${need} source(s) with https URLs`);
    }
    out.push({ key: def.key as SectionKey, title, blurb, body, photos, sources });
  }
  return { sections: out, problems };
}

// ───────────────────────── email ─────────────────────────

function para(text: string, style = "font-size:16px;line-height:1.6;margin:0 0 16px") {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="${style}">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

/** Who a newsletter email goes to. Guests are event RSVPs who aren't members: their link opens this issue for them. */
export type NewsletterRecipient = { email: string; name: string; guest?: boolean };

/** The teaser email: an opener, a blurb (and photo) per section, and a button to read the full issue on rihoso.com. */
export function renderNewsletterEmail(issue: Newsletter, person: NewsletterRecipient, base: string, test = false) {
  const issueUrl = person.guest
    ? `${base}/newsletter/${issue.slug}?${newsletterGuestParams(person.email, issue.slug)}`
    : `${base}/newsletter/${issue.slug}`;
  const month = issueMonthLabel(issue.issue_date);
  const unsubUrl = `${base}/unsubscribe?${unsubscribeParams(person.email)}`;
  const greeting = `Dear ${firstName(person.name)},`;
  const store = issue.sections.find((s) => s.key === "store");
  const lead = store?.photos[0];

  let lastGroup = "";
  const items = issue.sections
    .filter((s) => s.blurb)
    .map((s) => {
      const def = sectionDef(s.key)!;
      const groupHead =
        def.group !== lastGroup
          ? `<div style="margin:28px 0 10px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8a6d1f;border-bottom:1px solid #e8e0d0;padding-bottom:6px">${escapeHtml(GROUP_LABEL[def.group])}</div>`
          : "";
      lastGroup = def.group;
      const text = `
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8a6d1f">${escapeHtml(def.label)}</div>
        <div style="font-size:18px;font-weight:bold;margin:2px 0 4px">${escapeHtml(s.title)}</div>
        <div style="font-size:15px;line-height:1.55;color:#333">${escapeHtml(s.blurb.replace(/\[([^\]]+)\](?!\()/g, "$1"))}</div>`;
      // The store's first photo already leads the email, so its section shows the second one (if any).
      const photo = s.key === "store" ? s.photos[1] : s.photos[0];
      if (!photo) return `${groupHead}<div style="margin:0 0 18px">${text}</div>`;
      return `${groupHead}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 18px;border-collapse:collapse"><tr>
        <td style="width:132px;vertical-align:top;padding:4px 16px 0 0"><img src="${escapeHtml(newsletterPhotoUrl(photo.path))}" alt="${escapeHtml(photo.caption || s.title)}" width="132" style="display:block;width:132px;height:auto;border-radius:4px"/></td>
        <td style="vertical-align:top">${text}</td>
      </tr></table>`;
    })
    .join("");

  const button = (label: string) =>
    `<p style="margin:24px 0;text-align:center"><a href="${escapeHtml(issueUrl)}" style="display:inline-block;background:#1a2e1a;color:#f5f0e8;padding:14px 26px;text-decoration:none;border-radius:4px;font-family:Georgia,serif;letter-spacing:1px">${escapeHtml(label)}</a></p>`;

  const html = `
<div style="background:#f5f0e8;padding:24px 12px">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-top:4px solid #1a2e1a;font-family:Georgia,serif;color:#1a2e1a">
    <div style="padding:26px 28px 6px;text-align:center">
      <div style="font-size:22px;letter-spacing:4px;font-weight:bold">RIHOSO</div>
      <div style="font-size:11px;letter-spacing:2px;color:#8a6d1f;text-transform:uppercase">Rhode Island Horological Society</div>
      <div style="margin-top:18px;font-size:26px">${escapeHtml(NEWSLETTER_NAME)}</div>
      <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#777">${escapeHtml(month)}</div>
    </div>
    ${lead ? `<div style="padding:18px 28px 0"><img src="${escapeHtml(newsletterPhotoUrl(lead.path))}" alt="${escapeHtml(lead.caption || store?.title || "")}" style="display:block;width:100%;height:auto;border-radius:4px"/></div>` : ""}
    <div style="padding:20px 28px 8px">
      <p style="font-size:16px;line-height:1.6;margin:0 0 16px">${escapeHtml(greeting)}</p>
      ${para(issue.intro)}
      ${button("Read the full issue")}
      ${items}
      ${button("Read the full issue")}
      <p style="font-size:13px;line-height:1.5;color:#666;text-align:center;margin:0 0 8px">${
        person.guest
          ? `You're receiving this because you RSVP'd to a RIHOSO event, so this month's full issue is on us. <a href="${escapeHtml(`${base}/memberships`)}" style="color:#8a6d1f">Become a member</a> to get every issue, monthly meetings and more.`
          : "The full newsletter is for members. Sign in at rihoso.com with this email address; we'll send you a one-time code, no password needed."
      }</p>
    </div>
    <div style="padding:16px 28px 24px;border-top:1px solid #e8e0d0;font-size:12px;color:#777;line-height:1.5">
      Questions? Just reply to this email.<br/>
      ${escapeHtml(POSTAL())}<br/>
      <a href="${escapeHtml(unsubUrl)}" style="color:#777">Unsubscribe</a> from RIHOSO emails.
    </div>
  </div>
</div>`;

  const textItems = issue.sections
    .filter((s) => s.blurb)
    .map((s) => `${sectionDef(s.key)!.label.toUpperCase()}: ${s.title}\n${s.blurb}`)
    .join("\n\n");
  const access = person.guest
    ? `You're receiving this because you RSVP'd to a RIHOSO event, so this month's full issue is on us. Become a member to get every issue: ${base}/memberships`
    : "The full newsletter is for members. Sign in at rihoso.com with this email address.";
  const text = `${greeting}\n\n${issue.intro.trim()}\n\nRead the full issue: ${issueUrl}\n\n${textItems}\n\n${access}\n\n—\nRhode Island Horological Society\n${POSTAL()}\nUnsubscribe: ${unsubUrl}`;

  return {
    from: FROM(),
    to: [person.email],
    reply_to: REPLY_TO(),
    subject: `${test ? "[TEST] " : ""}${NEWSLETTER_NAME} — ${month}`,
    html,
    text,
    headers: {
      "List-Unsubscribe": `<${base}/api/unsubscribe?${unsubscribeParams(person.email)}>, <mailto:${REPLY_TO()}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

// ───────────────────────── sending ─────────────────────────

/**
 * Who an issue goes to: every current member, plus everyone who RSVP'd to a RIHOSO event (as a guest, with a
 * link that opens this issue), plus Brandon's copy. Unsubscribed people are left out.
 */
export async function newsletterRecipients() {
  const people = await loadDirectory();
  const to: NewsletterRecipient[] = [];
  let skipped = 0;
  for (const p of people) {
    const member = isMember(p);
    if (!member && p.events.length === 0) continue;
    if (p.unsubscribed) {
      skipped++;
      continue;
    }
    to.push({ email: p.email, name: p.name, guest: !member });
  }
  for (const email of brandonCopy()) {
    if (!to.some((p) => p.email === email.toLowerCase())) to.push({ email: email.toLowerCase(), name: "Brandon Salomon" });
  }
  return { to, skipped };
}

/**
 * Emails an approved issue to its recipients (see newsletterRecipients) and logs it in the sent log.
 * Claims the issue first (approved → sending) so a double click or an overlapping cron can't send twice.
 */
export async function sendNewsletter(issueId: string, base: string, sentBy: string | null) {
  const admin = createAdminClient();
  const { data: claimed } = await admin
    .from("newsletters")
    .update({ status: "sending" })
    .eq("id", issueId)
    .eq("status", "approved")
    .select(COLUMNS)
    .maybeSingle();
  if (!claimed) return { ok: false as const, error: "This issue isn't approved, or it is already sending or sent." };
  const issue = hydrate(claimed);

  try {
    const list = await newsletterRecipients();
    const to = list.to;
    const month = issueMonthLabel(issue.issue_date);
    const { data: campaign, error } = await admin
      .from("email_campaigns")
      .insert({
        subject: `${NEWSLETTER_NAME} — ${month}`,
        body: `${issue.intro}\n\n${issue.sections.map((s) => `${sectionDef(s.key)!.label}: ${s.title}`).join("\n")}`.slice(0, 20000),
        cta_label: "Read the full issue",
        cta_url: `${base}/newsletter/${issue.slug}`,
        audience: `newsletter:${issue.slug}`,
        audience_label: `Current members and event RSVPs — ${NEWSLETTER_NAME}`,
        sent_by: sentBy,
        recipient_count: to.length,
        skipped_unsubscribed: list.skipped,
      })
      .select("id")
      .single();
    if (error || !campaign) throw new Error("Couldn't start the send log");

    const results = await sendEach(to.map((p) => renderNewsletterEmail(issue, p, base)));
    const names = new Map(to.map((p) => [p.email, p.name]));
    await admin.from("email_deliveries").insert(
      results.map((r) => ({
        campaign_id: campaign.id,
        email: r.email,
        name: names.get(r.email) || null,
        resend_id: r.id ?? null,
        error: r.error ? r.error.slice(0, 500) : null,
      }))
    );
    const sent = results.filter((r) => !r.error).length;
    const failed = results.length - sent;
    await admin
      .from("email_campaigns")
      .update({ sent_count: sent, failed_count: failed, status: failed === 0 ? "sent" : sent === 0 ? "failed" : "partial", finished_at: new Date().toISOString() })
      .eq("id", campaign.id);

    if (sent === 0) {
      // Nothing went out: put it back so it can be tried again.
      await admin.from("newsletters").update({ status: "approved", campaign_id: campaign.id }).eq("id", issue.id);
      return { ok: false as const, error: "The email service didn't accept the send. Nothing went out." };
    }
    await admin.from("newsletters").update({ status: "sent", sent_at: new Date().toISOString(), campaign_id: campaign.id }).eq("id", issue.id);
    return { ok: true as const, sent, failed, skipped: list.skipped };
  } catch (err) {
    console.error("[newsletter] send failed", err);
    await admin.from("newsletters").update({ status: "approved" }).eq("id", issue.id).eq("status", "sending");
    return { ok: false as const, error: "Sending failed before any email went out. Try again." };
  }
}

/** Emails the admin a test copy. */
export async function sendNewsletterTest(issue: Newsletter, to: string, base: string) {
  const [result] = await sendEach([renderNewsletterEmail(issue, { email: to, name: "Brandon Salomon" }, base, true)]);
  return result;
}

// ───────────────────────── notices to Brandon ─────────────────────────

export function issueProblems(issue: Newsletter) {
  const notes: string[] = [];
  for (const def of SECTIONS) {
    const s = issue.sections.find((x) => x.key === def.key);
    if (!s || !s.body) notes.push(`${def.label} is empty`);
    else {
      const ph = findPlaceholders(`${s.title}\n${s.blurb}\n${s.body}`);
      if (ph.length) notes.push(`${def.label} still has ${ph.length} [placeholder]${ph.length > 1 ? "s" : ""} to fill in`);
    }
    const need = (def.minPhotos ?? def.photos) - (s?.photos.length ?? 0);
    if (need > 0) notes.push(`${def.label} needs ${need} more photo${need > 1 ? "s" : ""}`);
  }
  return notes;
}

export async function notifyDraftReady(issue: Newsletter, base: string) {
  const month = issueMonthLabel(issue.issue_date);
  const todo = issueProblems(issue);
  await sendNotification({
    subject: `${NEWSLETTER_NAME} — ${month} draft is ready for your review`,
    rows: [
      ["Review, edit and approve", `${base}/marketplace/admin/newsletter?issue=${issue.slug}`],
      ["Preview as members see it", `${base}/newsletter/${issue.slug}`],
      ["Goes out", `${issue.issue_date} at 9 AM, once you approve it`],
      ["Still to do", todo.length ? todo.map((t) => `• ${t}`).join("\n") : "Nothing — just read it over and approve."],
    ],
  });
  await createAdminClient().from("newsletters").update({ notified_at: new Date().toISOString() }).eq("id", issue.id);
}

/**
 * Daily (cron): sends approved issues whose date has come, and reminds Brandon once
 * about a draft that isn't approved 3 days before its date.
 */
export async function runNewsletterHousekeeping(base: string) {
  if (!isSupabaseConfigured()) return { skipped: true };
  const admin = createAdminClient();
  const today = todayInRI();
  const out: { sent: string[]; nudged: string[]; errors: string[] } = { sent: [], nudged: [], errors: [] };

  const { data: due, error } = await admin
    .from("newsletters")
    .select("id, slug")
    .eq("status", "approved")
    .lte("issue_date", today)
    .order("issue_date", { ascending: true })
    .limit(3);
  if (error) return { error: "newsletters table missing" };
  for (const row of due ?? []) {
    const r = await sendNewsletter(row.id as string, base, null);
    if (r.ok) out.sent.push(row.slug as string);
    else out.errors.push(`${row.slug}: ${r.error}`);
  }

  const soon = new Date(`${today}T12:00:00Z`);
  soon.setUTCDate(soon.getUTCDate() + 3);
  const { data: drafts } = await admin
    .from("newsletters")
    .select(COLUMNS)
    .eq("status", "draft")
    .is("nudged_at", null)
    .lte("issue_date", soon.toISOString().slice(0, 10))
    .limit(3);
  for (const row of drafts ?? []) {
    const issue = hydrate(row);
    const month = issueMonthLabel(issue.issue_date);
    const late = issue.issue_date <= today;
    const todo = issueProblems(issue);
    await sendNotification({
      subject: `Reminder: ${NEWSLETTER_NAME} — ${month} is waiting for your approval`,
      rows: [
        ["Review and approve", `${base}/marketplace/admin/newsletter?issue=${issue.slug}`],
        ["When it goes out", late ? "The next morning at 9 AM after you approve (or click Send now)" : `${issue.issue_date} at 9 AM if approved by then`],
        ["Still to do", todo.length ? todo.map((t) => `• ${t}`).join("\n") : "Nothing — just approve."],
      ],
    }).catch(() => {});
    await admin.from("newsletters").update({ nudged_at: new Date().toISOString() }).eq("id", issue.id);
    out.nudged.push(issue.slug);
  }
  return out;
}

// ───────────────────────── who is reading ─────────────────────────

/** The signed-in visitor (if any), and whether they may read members-only issues. */
export async function newsletterReader() {
  const { createClient } = await import("@/lib/supabase/server");
  const { isAdmin } = await import("@/lib/orders");
  if (!isSupabaseConfigured()) return { user: null, member: false, admin: false };
  const { data } = await createClient().auth.getUser();
  const user = data.user;
  if (!user) return { user: null, member: false, admin: false };
  const [member, admin] = await Promise.all([isActiveMember(user.id), isAdmin(user.id)]);
  return { user, member: member || admin, admin };
}

// ───────────────────────── writer photos ─────────────────────────

const IMAGE_TYPES: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  "image/jpeg": { ext: "jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { ext: "png", magic: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { ext: "webp", magic: (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP" },
};

/**
 * Adds one photo from the writer to a section of a draft issue. It only fills an empty photo slot: it never
 * replaces or removes a photo, and never touches the text, so it is safe on a draft Brandon has edited.
 */
export async function addWriterPhoto(input: {
  slug: string;
  key: string;
  bytes: Buffer;
  contentType: string;
  caption: string;
  credit: string;
}): Promise<{ ok: true; path: string; photos: number; slots: number } | { ok: false; status: number; error: string }> {
  const def = sectionDef(input.key);
  if (!def) return { ok: false, status: 400, error: `Unknown section "${input.key}"` };
  const type = IMAGE_TYPES[input.contentType];
  if (!type) return { ok: false, status: 400, error: "content_type must be image/jpeg, image/png or image/webp" };
  if (!type.magic(input.bytes)) return { ok: false, status: 400, error: "The image data doesn't match its content_type" };
  if (input.bytes.length < 2000 || input.bytes.length > 4 * 1024 * 1024) return { ok: false, status: 400, error: "Images must be between 2 KB and 4 MB" };
  if (!input.credit) return { ok: false, status: 400, error: "credit is required (who the photo is by or from)" };

  const issue = await getIssueBySlug(input.slug);
  if (!issue) return { ok: false, status: 404, error: "No issue for that month" };
  if (issue.status !== "draft") return { ok: false, status: 409, error: "Photos can only be added to a draft" };
  const section = issue.sections.find((s) => s.key === def.key);
  if (!section) return { ok: false, status: 409, error: "That section is empty in this issue" };
  if (section.photos.length >= def.photos) return { ok: false, status: 409, error: `${def.label} already has all its photos` };

  const admin = createAdminClient();
  const path = `${issue.slug}/${def.key}-${crypto.randomUUID().slice(0, 8)}.${type.ext}`;
  const up = await admin.storage.from(PHOTO_BUCKET).upload(path, input.bytes, { contentType: input.contentType, cacheControl: "31536000" });
  if (up.error) return { ok: false, status: 500, error: `Upload failed: ${up.error.message}` };

  // Re-read just before saving so a photo Brandon added meanwhile isn't lost.
  const fresh = await getIssueBySlug(input.slug);
  const target = fresh?.sections.find((s) => s.key === def.key);
  if (!fresh || fresh.status !== "draft" || !target || target.photos.length >= def.photos) {
    await admin.storage.from(PHOTO_BUCKET).remove([path]);
    return { ok: false, status: 409, error: "The issue changed while uploading; try again" };
  }
  const photo: NewsletterPhoto = { path, caption: input.caption.slice(0, 200), credit: input.credit.slice(0, 120) };
  const sections = fresh.sections.map((s) => (s.key === def.key ? { ...s, photos: [...s.photos, photo] } : s));
  const { error } = await admin.from("newsletters").update({ sections }).eq("id", fresh.id).eq("status", "draft");
  if (error) {
    await admin.storage.from(PHOTO_BUCKET).remove([path]);
    return { ok: false, status: 500, error: "Couldn't save the photo" };
  }
  return { ok: true, path, photos: target.photos.length + 1, slots: def.photos };
}
