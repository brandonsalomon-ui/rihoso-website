import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import ExchangeNav from "@/components/exchange/ExchangeNav";
import RepairRequestForm from "@/components/exchange/RepairRequestForm";
import { EXCLUDED_BRANDS_NOTE, REPAIRS_OPEN, SERVICES } from "@/lib/marketplace";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Watch Repair", description: SERVICES.repair.summary };
export const dynamic = "force-dynamic";


export default async function RepairPage() {
  const { user } = await getUser();
  return (
    <>
      <PageHero eyebrow="Watch Repair" title="Get Your Free Quote" subtitle={`Tell us about your watch and we'll come back with a price. ${EXCLUDED_BRANDS_NOTE}`}>
        <Link href="/repairs" className="text-gold-400 hover:text-gold-300 text-sm">How repairs work →</Link>
      </PageHero>
      <ExchangeNav signedIn={Boolean(user)} />
      <section className="py-14 bg-forest-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {!REPAIRS_OPEN ? (
            <div className="panel-lux rounded-xl p-8 text-center text-cream-200">
              Repair requests aren&apos;t open yet. Please check back soon.
            </div>
          ) : (
            <>
              {user?.email ? (
                <RepairRequestForm userId={user.id} email={user.email} />
              ) : (
                <div className="panel-lux rounded-xl p-8 text-center">
                  <p className="text-cream-200 mb-6">Sign in with your email to request a repair quote — it only takes a moment.</p>
                  <Link href="/marketplace/sign-in?next=/marketplace/repair" className="btn-gold inline-block px-8 py-3 font-semibold">Sign in</Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
