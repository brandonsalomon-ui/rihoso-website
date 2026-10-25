import { NextResponse } from "next/server";
import { clean, EMAIL_RE, sendNotification } from "@/lib/email";
import { createOnboardingLink, getStripe, isStripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Starts seller onboarding: creates a Stripe connected account for the seller and
 * returns a Stripe-hosted onboarding URL where they verify identity and add a bank account.
 * RIHOSO never sees or stores the seller's ID or bank details.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Seller sign-up isn't open yet. Please check back soon." }, { status: 503 });
  }

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
  const member = data.member === true || data.member === "on";
  const agreed = data.agree === true || data.agree === "on";

  if (!name || !EMAIL_RE.test(email) || phone.replace(/\D/g, "").length < 7) {
    return NextResponse.json({ error: "Please enter your name, a valid email and a phone number." }, { status: 400 });
  }
  if (!agreed) {
    return NextResponse.json({ error: "Please accept the seller terms to continue." }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const account = await stripe.accounts.create({
      country: "US",
      email,
      // Stripe-hosted onboarding + Express dashboard for the seller.
      // RIHOSO collects the buyer's payment, then transfers the seller's share.
      controller: {
        fees: { payer: "application" },
        losses: { payments: "application" },
        stripe_dashboard: { type: "express" },
      },
      capabilities: { transfers: { requested: true } },
      business_type: "individual",
      business_profile: {
        mcc: "5944", // Jewelry, watch, clock and silverware stores
        product_description: "Selling a personal pre-owned watch through the RIHOSO Watch Exchange",
      },
      metadata: { rihoso_role: "seller", name, phone, member_claimed: member ? "yes" : "no" },
    });

    const url = await createOnboardingLink(account.id, request);

    // Let RIHOSO know a new seller has started — informational, never blocks sign-up.
    sendNotification({
      subject: `New Watch Exchange seller: ${name}`,
      replyTo: email,
      rows: [
        ["Name", name],
        ["Email", email],
        ["Phone", phone],
        ["Says they're a member", member ? "Yes — please verify for the 10% rate" : "No"],
        ["Stripe account", account.id],
        ["Submitted", new Date().toLocaleString("en-US", { timeZone: "America/New_York" }) + " ET"],
      ],
    }).catch(() => {});

    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error("[marketplace] seller onboarding failed", err);
    return NextResponse.json(
      { error: "We couldn't start seller sign-up just now. Please try again or email info@rihoso.com." },
      { status: 502 }
    );
  }
}
