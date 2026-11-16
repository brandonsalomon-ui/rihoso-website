import { NextResponse } from "next/server";
import { EMAIL_RE, clean } from "@/lib/email";
import { tonightsEventTitle } from "@/lib/events";
import { startSponsorCheckout } from "@/lib/memberships";
import { recordAcceptance } from "@/lib/policy-acceptance";
import { UserError } from "@/lib/orders";
import { sponsorLevel } from "@/lib/sponsorship";
import { isStripeConfigured, siteUrl } from "@/lib/stripe";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";

/** "Sponsor Tonight's Event": no sign-in needed. Returns the Stripe Checkout URL. */
export async function POST(request: Request) {
  if (!isSupabaseConfigured() || !isStripeConfigured()) {
    return NextResponse.json({ error: "Online sponsorship isn't available right now." }, { status: 503 });
  }
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (clean(data.website, 200)) return NextResponse.json({ error: "Invalid request" }, { status: 400 }); // honeypot

  const level = sponsorLevel(data.level);
  const fullName = clean(data.name, 120);
  const email = clean(data.email, 200).toLowerCase();
  const phone = clean(data.phone, 40);
  const recognizeAs = clean(data.recognizeAs, 120);
  if (!level) return NextResponse.json({ error: "Please choose Partial or Full sponsor." }, { status: 400 });
  if (!fullName) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  if (phone && phone.replace(/\D/g, "").length < 7) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  }
  if (data.accept !== true) {
    return NextResponse.json({ error: "Please confirm you agree to the Membership Terms." }, { status: 400 });
  }

  try {
    const { url, userId, membershipId } = await startSponsorCheckout(
      { email, fullName, phone, level: level.id, recognizeAs, event: tonightsEventTitle() ?? "" },
      siteUrl(request)
    );
    await recordAcceptance(userId, ["membership", "terms"], "membership", { membershipId, request });
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    if (err instanceof UserError) return NextResponse.json({ error: err.message }, { status: 409 });
    console.error("[sponsor] checkout failed", err);
    return NextResponse.json({ error: "Couldn't start payment. Please try again." }, { status: 502 });
  }
}
