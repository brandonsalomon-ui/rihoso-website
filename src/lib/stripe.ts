// Server-only Stripe client and helpers for the RIHOSO marketplace.
// Required env var: STRIPE_SECRET_KEY (use the sandbox key "sk_test_..." until launch)
// Optional env var: NEXT_PUBLIC_SITE_URL (defaults to https://rihoso.com)

import "server-only";
import crypto from "node:crypto";
import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!client) client = new Stripe(key);
  return client;
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function siteUrl(request?: Request) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (request) return new URL(request.url).origin;
  return "https://rihoso.com";
}

// Onboarding links carry the seller's Stripe account id. We sign it so nobody can
// generate an onboarding link for someone else's account by editing the URL.
function signingKey() {
  return crypto
    .createHash("sha256")
    .update(`rihoso-seller-link:${process.env.STRIPE_SECRET_KEY ?? ""}`)
    .digest();
}

export function signAccountId(accountId: string) {
  return crypto.createHmac("sha256", signingKey()).update(accountId).digest("base64url");
}

export function verifyAccountId(accountId: string, sig: string) {
  if (!/^acct_[A-Za-z0-9]+$/.test(accountId) || !sig) return false;
  const expected = Buffer.from(signAccountId(accountId));
  const given = Buffer.from(sig);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

/** Builds a fresh Stripe-hosted onboarding link for a seller account. */
export async function createOnboardingLink(accountId: string, request?: Request) {
  const base = siteUrl(request);
  const sig = signAccountId(accountId);
  const qs = `account=${encodeURIComponent(accountId)}&sig=${encodeURIComponent(sig)}`;
  const link = await getStripe().accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${base}/api/marketplace/sellers/refresh?${qs}`,
    return_url: `${base}/marketplace/sell/return?${qs}`,
  });
  return link.url;
}
