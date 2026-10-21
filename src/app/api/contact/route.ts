import { NextResponse } from "next/server";
import { clean, EMAIL_RE, sendNotification } from "@/lib/email";

export const runtime = "nodejs";

const SUBJECTS: Record<string, string> = {
  general: "General Inquiry",
  membership: "Membership Question",
  events: "Events",
  sponsorship: "Sponsorship",
  other: "Other",
};

export async function POST(request: Request) {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (clean(data.website)) return NextResponse.json({ ok: true });

  const name = clean(data.name, 120);
  const email = clean(data.email, 200);
  const phone = clean(data.phone, 40);
  const topic = SUBJECTS[clean(data.subject, 30)] || "General Inquiry";
  const message = clean(data.message, 5000);

  if (!name || !EMAIL_RE.test(email) || !message) {
    return NextResponse.json(
      { error: "Please fill in your name, a valid email, and a message." },
      { status: 400 }
    );
  }

  const result = await sendNotification({
    subject: `RIHOSO website message (${topic}) from ${name}`,
    replyTo: email,
    rows: [
      ["Topic", topic],
      ["Name", name],
      ["Email", email],
      ["Phone", phone],
      ["Message", message],
    ],
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "Sorry — your message couldn't be sent just now. Please try again or email info@rihoso.com." },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true });
}
