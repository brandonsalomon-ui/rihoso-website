import { NextResponse } from "next/server";
import { createOnboardingLink, isStripeConfigured, siteUrl, verifyAccountId } from "@/lib/stripe";

export const runtime = "nodejs";

/** Stripe sends sellers here when an onboarding link expires; we mint a new one. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const account = searchParams.get("account") ?? "";
  const sig = searchParams.get("sig") ?? "";

  if (!isStripeConfigured() || !verifyAccountId(account, sig)) {
    return NextResponse.redirect(`${siteUrl(request)}/marketplace/sell?error=link`);
  }

  try {
    return NextResponse.redirect(await createOnboardingLink(account, request));
  } catch (err) {
    console.error("[marketplace] refresh link failed", err);
    return NextResponse.redirect(`${siteUrl(request)}/marketplace/sell?error=link`);
  }
}
