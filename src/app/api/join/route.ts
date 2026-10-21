import { NextResponse } from "next/server";
import { clean, EMAIL_RE, sendNotification } from "@/lib/email";
import { MEMBERSHIP_TIERS } from "@/lib/membership";

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

  const name = clean(data.name, 120);
  const email = clean(data.email, 200);
  const phone = clean(data.phone, 40);
  const tierId = clean(data.tier, 20);
  const tier = MEMBERSHIP_TIERS.find((t) => t.id === tierId);

  if (!name || !EMAIL_RE.test(email) || phone.replace(/\D/g, "").length < 7 || !tier) {
    return NextResponse.json(
      { error: "Please fill in your name, a valid email, a phone number, and a membership type." },
      { status: 400 }
    );
  }

  const result = await sendNotification({
    subject: `New RIHOSO membership sign-up: ${name} (${tier.name})`,
    replyTo: email,
    rows: [
      ["Membership", `${tier.name} — ${tier.price} ${tier.period}`],
      ["Name", name],
      ["Email", email],
      ["Phone", phone],
      ["Submitted", new Date().toLocaleString("en-US", { timeZone: "America/New_York" }) + " ET"],
    ],
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "Sorry — we couldn't submit your sign-up just now. Please try again or email info@rihoso.com." },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true });
}
