import { NextResponse } from "next/server";
import { clean } from "@/lib/email";
import { startMembershipCheckout } from "@/lib/memberships";
import { recordAcceptance } from "@/lib/policy-acceptance";
import { UserError } from "@/lib/orders";
import { isStripeConfigured, siteUrl } from "@/lib/stripe";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Starts a $120 membership payment for the signed-in person and returns the Stripe Checkout URL. */
export async function POST(request: Request) {
  if (!isSupabaseConfigured() || !isStripeConfigured()) {
    return NextResponse.json({ error: "Online membership isn't available yet." }, { status: 503 });
  }
  const { user } = await getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first.", signIn: `/marketplace/sign-in?next=${encodeURIComponent("/memberships#join")}` },
      { status: 401 }
    );
  }
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (clean(data.website, 200)) return NextResponse.json({ error: "Invalid request" }, { status: 400 }); // honeypot
  const name = clean(data.name, 120);
  const phone = clean(data.phone, 40);
  if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (data.accept !== true) {
    return NextResponse.json({ error: "Please confirm you agree to the Membership Terms." }, { status: 400 });
  }
  if (phone && phone.replace(/\D/g, "").length < 7) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  }
  try {
    const { url, membershipId } = await startMembershipCheckout(user.id, name, phone, siteUrl(request));
    await recordAcceptance(user.id, ["membership", "terms"], "membership", { membershipId, request });
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    if (err instanceof UserError) return NextResponse.json({ error: err.message }, { status: 409 });
    console.error("[membership] checkout failed", err);
    return NextResponse.json({ error: "Couldn't start payment. Please try again." }, { status: 502 });
  }
}
