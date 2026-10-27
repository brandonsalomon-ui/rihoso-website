import { NextResponse } from "next/server";
import { clean, EMAIL_RE, sendNotification, sendRsvpConfirmation } from "@/lib/email";
import { findRsvpEvent, saveRsvp } from "@/lib/rsvps";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Honeypot: real people never fill this hidden field.
  if (clean(data.website)) return NextResponse.json({ ok: true });

  const found = findRsvpEvent(clean(data.slug, 80));
  if (!found) return NextResponse.json({ error: "This event isn't taking RSVPs." }, { status: 404 });
  if (!found.open) {
    return NextResponse.json(
      { error: "RSVPs for this event are closed. Email info@rihoso.com and we'll do our best to fit you in." },
      { status: 400 }
    );
  }
  const { event } = found;

  const name = clean(data.name, 120);
  const email = clean(data.email, 200).toLowerCase();
  const phone = clean(data.phone, 40);
  const saysMember = data.member === "yes";
  const guests = data.guest === true || data.guest === "on" ? 1 : 0;

  if (!name || !EMAIL_RE.test(email) || (phone && phone.replace(/\D/g, "").length < 7)) {
    return NextResponse.json({ error: "Please fill in your name and a valid email (and phone, if you add one)." }, { status: 400 });
  }
  if (data.member !== "yes" && data.member !== "no") {
    return NextResponse.json({ error: "Please tell us whether you're a RIHOSO member." }, { status: 400 });
  }

  const saved = await saveRsvp({ slug: event.rsvp!.slug, name, email, phone, saysMember, guests });

  const memberStatus = saved?.memberVerified
    ? "Yes — verified member"
    : saysMember
      ? "Says yes — not found as a member on the Exchange (check your list)"
      : "No — not a member";

  const notified = await sendNotification({
    subject: `RSVP: ${event.shortTitle || event.title} — ${name}${guests ? " (+1)" : ""}`,
    replyTo: email,
    rows: [
      ["Event", `${event.title} · ${event.date}, ${event.time}`],
      ["Name", name],
      ["Email", email],
      ["Phone", phone],
      ["Member", memberStatus],
      ["Guest", guests ? "Bringing 1 guest" : "No guest"],
      ["Total so far", saved ? `${saved.rsvps} RSVPs · ${saved.people} people` : "(not saved to the database — keep this email)"],
      ["Submitted", new Date().toLocaleString("en-US", { timeZone: "America/New_York" }) + " ET"],
    ],
  });

  if (!saved && !notified.ok) {
    return NextResponse.json(
      { error: "Sorry — we couldn't record your RSVP just now. Please try again or email info@rihoso.com." },
      { status: 502 }
    );
  }

  await sendRsvpConfirmation({
    to: email,
    name,
    eventTitle: event.title,
    when: `${event.date}, ${event.time}`,
    where: event.location,
    guests,
    joinNote:
      !saysMember && event.badge === "Members"
        ? "This is a members' evening. You can join the Society for $120 a year at rihoso.com/memberships before the event."
        : undefined,
  }).catch(() => undefined);

  return NextResponse.json({ ok: true });
}
