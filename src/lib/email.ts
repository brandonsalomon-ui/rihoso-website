// Sends website form submissions by email through Resend (https://resend.com).
// Required env var: RESEND_API_KEY
// Optional env vars: FORM_NOTIFY_EMAIL (default brandonsalomon@gmail.com),
//                    FORM_FROM_EMAIL (default "RIHOSO Website <website@rihoso.com>")

const DEFAULT_TO = "brandonsalomon@gmail.com";
const DEFAULT_FROM = "RIHOSO Website <website@rihoso.com>";

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendNotification({
  subject,
  rows,
  replyTo,
}: {
  subject: string;
  rows: [string, string][];
  replyTo?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[forms] RESEND_API_KEY is not set — submission not emailed", { subject, rows });
    return { ok: false as const, error: "Email is not configured" };
  }

  const html = `
    <div style="font-family:Georgia,serif;color:#1a2e1a;max-width:560px">
      <h2 style="margin:0 0 16px">${escapeHtml(subject)}</h2>
      <table style="border-collapse:collapse;width:100%">
        ${rows
          .map(
            ([label, value]) => `
          <tr>
            <td style="padding:8px 12px 8px 0;font-weight:bold;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td>
            <td style="padding:8px 0;white-space:pre-wrap">${escapeHtml(value || "—")}</td>
          </tr>`
          )
          .join("")}
      </table>
      <p style="margin-top:24px;color:#666;font-size:12px">Sent from the form on rihoso.com</p>
    </div>`;
  const text = rows.map(([label, value]) => `${label}: ${value || "—"}`).join("\n");

  const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.FORM_FROM_EMAIL || DEFAULT_FROM,
      to: (process.env.FORM_NOTIFY_EMAIL || DEFAULT_TO).split(",").map((s) => s.trim()),
      reply_to: replyTo,
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[forms] Resend error", res.status, body);
    return { ok: false as const, error: "Email service error" };
  }
  return { ok: true as const };
}

/** Sends a plain notification email to a member (e.g. "you have a new message"). */
export async function sendMemberEmail({
  to,
  subject,
  intro,
  quote,
  ctaLabel,
  ctaUrl,
}: {
  to: string;
  subject: string;
  intro: string;
  quote?: string;
  ctaLabel: string;
  ctaUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[email] RESEND_API_KEY is not set — member email not sent", { subject });
    return { ok: false as const };
  }
  const html = `
    <div style="font-family:Georgia,serif;color:#1a2e1a;max-width:560px">
      <p style="font-size:16px">${escapeHtml(intro)}</p>
      ${quote ? `<blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #c9a84c;background:#f5f0e8;white-space:pre-wrap">${escapeHtml(quote)}</blockquote>` : ""}
      <p><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#c9a84c;color:#0f1d0f;padding:10px 18px;text-decoration:none;border-radius:4px">${escapeHtml(ctaLabel)}</a></p>
      <p style="margin-top:24px;color:#666;font-size:12px">RIHOSO Watch Exchange · Please keep all conversations and payments on RIHOSO.</p>
    </div>`;
  const text = `${intro}\n\n${quote ? `"${quote}"\n\n` : ""}${ctaLabel}: ${ctaUrl}`;
  const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EXCHANGE_FROM_EMAIL || process.env.FORM_FROM_EMAIL || "RIHOSO Watch Exchange <website@rihoso.com>",
      to: [to],
      subject,
      html,
      text,
    }),
  });
  if (!res.ok) console.error("[email] Resend error", res.status, await res.text().catch(() => ""));
  return { ok: res.ok };
}

/** Confirms an event RSVP to the person who sent it. Replies go to info@rihoso.com. */
export async function sendRsvpConfirmation({
  to,
  name,
  eventTitle,
  when,
  where,
  guests,
  joinNote,
}: {
  to: string;
  name: string;
  eventTitle: string;
  when: string;
  where: string;
  guests: number;
  /** Extra paragraph, e.g. a reminder to join before a members' evening. */
  joinNote?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[email] RESEND_API_KEY is not set — RSVP confirmation not sent");
    return { ok: false as const };
  }
  const first = name.split(/\s+/)[0] || name;
  const party = guests > 0 ? "you and your guest" : "you";
  const html = `
    <div style="font-family:Georgia,serif;color:#1a2e1a;max-width:560px">
      <p style="font-size:16px">Dear ${escapeHtml(first)},</p>
      <p style="font-size:16px">Thank you for your RSVP. We look forward to seeing ${party} at the ${escapeHtml(eventTitle)}.</p>
      <table style="border-collapse:collapse;margin:16px 0;border-left:3px solid #c9a84c;background:#f5f0e8">
        <tr><td style="padding:10px 16px 4px;font-weight:bold">When</td><td style="padding:10px 16px 4px">${escapeHtml(when)}</td></tr>
        <tr><td style="padding:4px 16px 10px;font-weight:bold">Where</td><td style="padding:4px 16px 10px">${escapeHtml(where)}</td></tr>
      </table>
      ${joinNote ? `<p style="font-size:16px">${escapeHtml(joinNote)}</p>` : ""}
      <p style="font-size:16px">If your plans change, simply reply to this email and let us know.</p>
      <p style="font-size:16px">With warm regards,<br/>The Rhode Island Horological Society</p>
      <p style="margin-top:24px;color:#666;font-size:12px">rihoso.com · info@rihoso.com</p>
    </div>`;
  const text = `Dear ${first},

Thank you for your RSVP. We look forward to seeing ${party} at the ${eventTitle}.

When: ${when}
Where: ${where}
${joinNote ? `\n${joinNote}\n` : ""}
If your plans change, simply reply to this email and let us know.

With warm regards,
The Rhode Island Horological Society
rihoso.com · info@rihoso.com`;
  const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.FORM_FROM_EMAIL || DEFAULT_FROM,
      to: [to],
      reply_to: "info@rihoso.com",
      subject: `You're on the list: ${eventTitle}`,
      html,
      text,
    }),
  });
  if (!res.ok) console.error("[email] Resend error", res.status, await res.text().catch(() => ""));
  return { ok: res.ok };
}
