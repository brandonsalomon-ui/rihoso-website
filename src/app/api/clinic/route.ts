import { NextResponse } from "next/server";
import { clean, EMAIL_RE, sendNotification } from "@/lib/email";

export const runtime = "nodejs";

/** Watchmaking Clinic inquiry form. Emails RIHOSO; nothing is stored in the database. */
export async function POST(request: Request) {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (clean(data.website)) return NextResponse.json({ ok: true }); // honeypot

  const name = clean(data.name, 120);
  const email = clean(data.email, 200);
  const phone = clean(data.phone, 40);
  const notes = clean(data.notes, 3000);

  if (!name || !EMAIL_RE.test(email) || phone.replace(/\D/g, "").length < 7) {
    return NextResponse.json({ error: "Please add your name, a valid email and a phone number." }, { status: 400 });
  }

  const result = await sendNotification({
    subject: `Watchmaking Clinic inquiry: ${name}`,
    replyTo: email,
    rows: [
      ["Name", name],
      ["Email", email],
      ["Phone", phone],
      ["What they're looking to do", notes],
    ],
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "Sorry — the form couldn't be sent just now. Please try again or email info@rihoso.com." },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true });
}
