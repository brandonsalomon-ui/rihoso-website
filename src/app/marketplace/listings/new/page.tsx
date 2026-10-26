import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PageHero from "@/components/PageHero";
import ExchangeNav from "@/components/exchange/ExchangeNav";
import ListingForm from "@/components/exchange/ListingForm";
import { getSellerAccount } from "@/lib/sellers";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "List a Watch", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  const { user } = await getUser();
  if (!user) redirect("/marketplace/sign-in?next=/marketplace/listings/new");
  const seller = await getSellerAccount(user.id);

  return (
    <>
      <PageHero eyebrow="Watch Exchange" title="List a Watch" subtitle="Good photos and honest details sell watches." />
      <ExchangeNav signedIn />
      <section className="py-14 bg-forest-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {!seller?.payouts_enabled && (
            <div className="mb-8 rounded border border-gold-400/40 bg-gold-400/10 px-5 py-4 text-sm text-cream-100">
              You can save a draft now. To publish it, first{" "}
              <Link href="/marketplace/sell" className="text-gold-300 underline">finish your seller setup</Link> so we can pay you.
            </div>
          )}
          <ListingForm userId={user.id} canPublish={Boolean(seller?.payouts_enabled)} />
        </div>
      </section>
    </>
  );
}
