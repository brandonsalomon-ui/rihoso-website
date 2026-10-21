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
