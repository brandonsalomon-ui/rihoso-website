import { NextResponse } from "next/server";
import { clean, sendNotification } from "@/lib/email";
import { createOnboardingLink, getStripe, isStripeConfigured } from "@/lib/stripe";
import { getSellerAccount } from "@/lib/sellers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Starts (or resumes) seller onboarding for the signed-in user: creates their Stripe
 * connected account once, records it, and returns a Stripe-hosted onboarding URL where
 * they verify identity and add a bank account. RIHOSO never sees ID or bank details.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Seller sign-up isn't open yet. Please check back soon." }, { status: 503 });
  }
  const { user } = await getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Please sign in first.", signIn: true }, { status: 401 });
  }

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (clean(data.website)) return NextResponse.json({ ok: true }); // honeypot

  try {
    // Already started? Just send them back to Stripe to finish.
    const existing = await getSellerAccount(user.id);
    if (existing) {
      return NextResponse.json({ ok: true, url: await createOnboardingLink(existing.stripe_account_id, request) });
    }

    const name = clean(data.name, 120);
    const phone = clean(data.phone, 40);
    const member = data.member === true || data.member === "on";
    const agreed = data.agree === true || data.agree === "on";
    if (!name || phone.replace(/\D/g, "").length < 7) {
      return NextResponse.json({ error: "Please enter your name and a phone number." }, { status: 400 });
    }
    if (!agreed) {
      return NextResponse.json({ error: "Please accept the seller terms to continue." }, { status: 400 });
    }

    const account = await getStripe().accounts.create({
      country: "US",
      email: user.email,
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
      metadata: { rihoso_role: "seller", rihoso_user_id: user.id, name, phone, member_claimed: member ? "yes" : "no" },
    });

    const { error } = await createAdminClient().from("seller_accounts").insert({
      user_id: user.id,
      stripe_account_id: account.id,
      full_name: name,
      phone,
      member_claimed: member,
    });
    if (error) throw error;

    const url = await createOnboardingLink(account.id, request);

    sendNotification({
      subject: `New Watch Exchange seller: ${name}`,
      replyTo: user.email,
      rows: [
        ["Name", name],
        ["Email", user.email],
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
