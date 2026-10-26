import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PageHero from "@/components/PageHero";
import SellerSignup from "@/components/SellerSignup";
import { getSellerAccount } from "@/lib/sellers";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sell a Watch",
  description: "Set up your RIHOSO Watch Exchange seller account.",
};
export const dynamic = "force-dynamic";

export default async function SellPage({ searchParams }: { searchParams: { error?: string } }) {
  const { user } = isSupabaseConfigured() ? await getUser() : { user: null };
  const seller = user ? await getSellerAccount(user.id) : null;
  if (seller?.payouts_enabled) redirect("/marketplace/account");

  return (
    <>
      <PageHero
        eyebrow="Watch Exchange"
        title="Become a Seller"
        subtitle="Set up your seller account once, then list as many watches as you like."
      />
      <section className="py-20 sm:py-24 bg-forest-800">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          {searchParams.error === "link" && (
            <p className="mb-8 text-sm text-red-300 bg-red-900/30 border border-red-400/30 rounded px-4 py-3" role="alert">
              That sign-up link is no longer valid. Please start again below.
            </p>
          )}
          {!user ? (
            <div className="panel-lux rounded-xl p-8 text-center">
              <h2 className="text-2xl font-display text-cream-50 mb-3">Sign in to start selling</h2>
              <p className="text-cream-300 mb-8">We&apos;ll email you a secure sign-in link — no password needed.</p>
              <Link href="/marketplace/sign-in?next=/marketplace/sell" className="btn-gold inline-block px-8 py-3 font-semibold">
                Sign in
              </Link>
            </div>
          ) : (
            <SellerSignup resume={Boolean(seller)} />
          )}
        </div>
      </section>
    </>
  );
}
