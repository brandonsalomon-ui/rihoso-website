import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export type SellerAccount = {
  user_id: string;
  stripe_account_id: string;
  payouts_enabled: boolean;
  details_submitted: boolean;
  full_name: string | null;
  phone: string | null;
  member_claimed: boolean;
};

export function isReady(acct: Stripe.Account) {
  return Boolean(acct.payouts_enabled && acct.capabilities?.transfers === "active");
}

/** Copies the seller's current Stripe status into our database. */
export async function syncSellerFromStripe(stripeAccountId: string) {
  const acct = await getStripe().accounts.retrieve(stripeAccountId);
  try {
    await createAdminClient()
      .from("seller_accounts")
      .update({ payouts_enabled: isReady(acct), details_submitted: Boolean(acct.details_submitted) })
      .eq("stripe_account_id", stripeAccountId);
  } catch (err) {
    console.error("[marketplace] couldn't save seller status", err);
  }
  return acct;
}

export async function getSellerAccount(userId: string) {
  const { data } = await createAdminClient()
    .from("seller_accounts")
    .select("user_id, stripe_account_id, payouts_enabled, details_submitted, full_name, phone, member_claimed")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as SellerAccount | null) ?? null;
}
