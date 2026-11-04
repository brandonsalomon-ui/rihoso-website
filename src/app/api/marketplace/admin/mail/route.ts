import { NextResponse } from "next/server";
import { clean, EMAIL_RE } from "@/lib/email";
import { loadDirectory, recipients, renderEmail, renderPersonal, sendEach, type Message, type Person } from "@/lib/member-mail";
import { isAdmin } from "@/lib/orders";
import { siteUrl } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

function readMessage(data: Record<string, unknown>): Message | string {
  const subject = clean(data.subject, 200);
  const body = clean(data.body, 20000);
  const ctaLabel = clean(data.ctaLabel, 60);
  const ctaUrl = clean(data.ctaUrl, 500);
  if (!subject) return "Please add a subject.";
  if (body.length < 10) return "Please write the message.";
  if ((ctaLabel && !ctaUrl) || (!ctaLabel && ctaUrl)) return "A button needs both a label and a link — or leave both empty.";
  if (ctaUrl && !/^https:\/\/\S+$/.test(ctaUrl)) return "The button link must start with https://";
  return { subject, body, ctaLabel: ctaLabel || undefined, ctaUrl: ctaUrl || undefined };
}

/** Admin only. action "test" emails the admin a preview; action "send" emails everyone in the audience. */
export async function POST(request: Request) {
  const { user } = await getUser();
  if (!user || !(await isAdmin(user.id))) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const msg = readMessage(data);
  if (typeof msg === "string") return NextResponse.json({ error: msg }, { status: 400 });
  const base = siteUrl(request);
  const action = String(data.action ?? "");

  if (action === "test") {
    if (!user.email) return NextResponse.json({ error: "Your account has no email address." }, { status: 400 });
    const testMsg = { ...msg, subject: `[TEST] ${msg.subject}` };
    const me = { email: user.email, name: clean(data.toName, 120) || "Brandon Salomon" };
    // A test of a personal note looks exactly like the real one, minus the blind copy.
    const email = data.audience === "one" ? { ...renderPersonal(testMsg, me), bcc: undefined } : renderEmail(testMsg, me, base);
    const [result] = await sendEach([email]);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json({ ok: true, sentTo: user.email });
  }

  if (action !== "send") return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  const people = await loadDirectory();
  let audienceId = clean(data.audience, 80);
  let list: { audience: { label: string }; to: Pick<Person, "email" | "name">[]; skipped: number } | null;
  const personal = audienceId === "one";
  if (personal) {
    // A personal note to one address, e.g. a follow-up with someone who didn't finish joining.
    const email = clean(data.toEmail, 200).toLowerCase();
    const name = clean(data.toName, 120);
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (people.some((p) => p.email === email && p.unsubscribed)) {
      return NextResponse.json({ error: "This person unsubscribed from RIHOSO emails." }, { status: 409 });
    }
    audienceId = `one:${email}`.slice(0, 80);
    list = { audience: { label: `One person: ${name || email}`.slice(0, 200) }, to: [{ email, name }], skipped: 0 };
  } else {
    list = recipients(people, audienceId);
    if (!list) return NextResponse.json({ error: "Pick who should receive it." }, { status: 400 });
    if (!list.to.length) return NextResponse.json({ error: "Nobody in that group to email yet." }, { status: 400 });
    // The page shows a count and asks to confirm it; if the list changed since, show the new number first.
    if (Number(data.expectedCount) !== list.to.length) {
      return NextResponse.json(
        { error: `The list changed — it's now ${list.to.length} people. Refresh the page and send again.` },
        { status: 409 }
      );
    }
  }

  const admin = createAdminClient();
  // Guard against a double-click or a second tab sending the same announcement twice.
  const recent = await admin
    .from("email_campaigns")
    .select("id")
    .eq("subject", msg.subject)
    .eq("audience", audienceId)
    .gt("created_at", new Date(Date.now() - 10 * 60000).toISOString())
    .limit(1);
  if (recent.error) {
    return NextResponse.json(
      { error: "The email log isn't set up in the database yet (migration 0009). Nothing was sent." },
      { status: 500 }
    );
  }
  if (recent.data?.length) {
    return NextResponse.json(
      { error: "This exact announcement was just sent to this group. Change the subject if you mean to send it again." },
      { status: 409 }
    );
  }

  const { data: campaign, error } = await admin
    .from("email_campaigns")
    .insert({
      subject: msg.subject,
      body: msg.body,
      cta_label: msg.ctaLabel ?? null,
      cta_url: msg.ctaUrl ?? null,
      audience: audienceId,
      audience_label: list.audience.label,
      sent_by: user.id,
      recipient_count: list.to.length,
      skipped_unsubscribed: list.skipped,
    })
    .select("id")
    .single();
  if (error || !campaign) return NextResponse.json({ error: "Couldn't start the send. Nothing was sent." }, { status: 500 });

  const results = await sendEach(list.to.map((p) => (personal ? renderPersonal(msg, p) : renderEmail(msg, p, base))));
  const names = new Map(list.to.map((p) => [p.email, p.name]));
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
    .update({
      sent_count: sent,
      failed_count: failed,
      status: failed === 0 ? "sent" : sent === 0 ? "failed" : "partial",
      finished_at: new Date().toISOString(),
    })
    .eq("id", campaign.id);

  if (sent === 0) return NextResponse.json({ error: "The email service didn't accept the send. Nothing went out." }, { status: 502 });
  return NextResponse.json({ ok: true, sent, failed, skipped: list.skipped });
}
