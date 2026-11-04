import "server-only";
import { brandonCopy, escapeHtml } from "@/lib/email";
import { todayInRI } from "@/lib/events";

/**
 * The welcome letter every new member gets the moment their $120 payment goes through.
 * Sent from membership@rihoso.com; replies land in that inbox.
 *
 * The Capriccio paragraph (and "See you on the 24th.") show only through the day of the meet-up,
 * so the letter never invites someone to an event that has already happened.
 * Edit the wording here — each string is one paragraph.
 */

const CAPRICCIO_LAST_DAY = "2026-11-24";

type Block = { title?: string; text: string; link?: { label: string; href: string } };

function letter(firstName: string, base: string) {
  const showMeetUp = todayInRI() <= CAPRICCIO_LAST_DAY;
  const blocks: Block[] = [
    { text: `Hi ${firstName},` },
    {
      text: "Thank you for joining the Rhode Island Horological Society. Whether you're a lifelong collector, a working watchmaker, or just starting to fall for the craft, we're glad you're here.",
    },
    { text: "This is going to be an exciting year for RIHOSO, with a lot more on the calendar. Here's what's coming up:" },
  ];
  if (showMeetUp) {
    blocks.push({
      title: "Late Fall Members' Meet-Up",
      text: "Tuesday, November 24, 7–9 PM, in the bar area at Capriccio in Providence. Bring a watch, meet fellow members and some of our watchmakers, and get a first look at the new RIHOSO Watch Exchange. Please RSVP at",
      link: { label: "rihoso.com", href: `${base}/events` },
    });
  }
  blocks.push(
    {
      title: "The Watch Exchange",
      text: "launching this December. It's a watches-only marketplace on rihoso.com, and as a member you'll sell at a reduced 5% fee.",
    },
    { title: "Monthly meetings", text: "starting in January 2027, we'll be getting together every month." },
    {
      title: "Watchmaking Clinic",
      text: "learn how a watch works and put one together alongside a RIHOSO watchmaker. Members pay $50 per person, and it makes a great holiday gift.",
    },
    {
      text: "Every dollar RIHOSO raises goes back into the foundation, funding scholarships and our operations, so your membership directly supports the next generation of watchmakers.",
    },
    { text: "If you have ideas for events, topics, or anything you'd like to see from RIHOSO, just reply to this email. I read every one." },
    { text: showMeetUp ? "Hope you're as excited as we are. See you on the 24th." : "Hope you're as excited as we are." }
  );
  return blocks;
}

const P = 'style="font-size:16px;line-height:1.6;margin:0 0 18px"';

export function welcomeEmail({ to, fullName, memberUntil, base }: { to: string; fullName: string; memberUntil: string; base: string }) {
  const firstName = fullName.trim().split(/\s+/)[0] || "there";
  const blocks = letter(firstName, base);
  const htmlBlocks = blocks
    .map((b) => {
      const title = b.title ? `<strong>${escapeHtml(b.title)}</strong> — ` : "";
      const link = b.link ? ` <a href="${escapeHtml(b.link.href)}" style="color:#8a6d1f">${escapeHtml(b.link.label)}</a>.` : "";
      return `<p ${P}>${title}${escapeHtml(b.text)}${link}</p>`;
    })
    .join("\n");
  const textBlocks = blocks
    .map((b) => `${b.title ? `${b.title} — ` : ""}${b.text}${b.link ? ` ${b.link.label}.` : ""}`)
    .join("\n\n");

  const html = `
<div style="background:#f5f0e8;padding:24px 12px">
  <div style="max-width:580px;margin:0 auto;background:#ffffff;border-top:4px solid #1a2e1a;font-family:Georgia,serif;color:#1a2e1a">
    <div style="padding:24px 28px 8px;text-align:center">
      <div style="font-size:22px;letter-spacing:4px;font-weight:bold">RIHOSO</div>
      <div style="font-size:11px;letter-spacing:2px;color:#8a6d1f;text-transform:uppercase">Rhode Island Horological Society</div>
    </div>
    <div style="padding:20px 28px 8px">
      ${htmlBlocks}
      <p ${P}>Warm regards,</p>
      <p style="font-size:16px;line-height:1.5;margin:0 0 24px">
        Brandon Salomon<br/>
        Founder, Rhode Island Horological Society<br/>
        <a href="mailto:membership@rihoso.com" style="color:#8a6d1f">membership@rihoso.com</a> | <a href="${escapeHtml(base)}" style="color:#8a6d1f">rihoso.com</a>
      </p>
    </div>
    <div style="padding:14px 28px 22px;border-top:1px solid #e8e0d0;font-size:12px;color:#777;line-height:1.5">
      Your membership is active until ${escapeHtml(memberUntil)} and doesn't renew automatically — we'll email you before it ends.
    </div>
  </div>
</div>`;

  const text = `${textBlocks}

Warm regards,

Brandon Salomon
Founder, Rhode Island Horological Society
membership@rihoso.com | rihoso.com

—
Your membership is active until ${memberUntil} and doesn't renew automatically — we'll email you before it ends.`;

  return {
    from: process.env.WELCOME_FROM_EMAIL || '"Brandon Salomon, RIHOSO" <membership@rihoso.com>',
    to: [to],
    bcc: brandonCopy(),
    reply_to: "membership@rihoso.com",
    subject: "Welcome to RIHOSO — thank you for joining",
    html,
    text,
  };
}

export async function sendWelcomeEmail(args: Parameters<typeof welcomeEmail>[0]) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[welcome] RESEND_API_KEY is not set — welcome email not sent");
    return { ok: false as const };
  }
  const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(welcomeEmail(args)),
  });
  if (!res.ok) console.error("[welcome] Resend error", res.status, await res.text().catch(() => ""));
  return { ok: res.ok };
}
