import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import ExchangeNav from "@/components/exchange/ExchangeNav";
import RepairRequestForm from "@/components/exchange/RepairRequestForm";
import { SERVICES } from "@/lib/marketplace";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Watch Repair", description: SERVICES.repair.summary };
export const dynamic = "force-dynamic";

export default async function RepairPage() {
  const { user } = await getUser();
  return (
    <>
      <PageHero eyebrow="Watch Exchange" title="Repair & Service" subtitle={SERVICES.repair.summary} />
      <ExchangeNav signedIn={Boolean(user)} />
      <section className="py-14 bg-forest-800">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          {user ? (
            <RepairRequestForm />
          ) : (
            <div className="panel-lux rounded-xl p-8 text-center">
              <p className="text-cream-200 mb-6">Sign in to request a repair quote.</p>
              <Link href="/marketplace/sign-in?next=/marketplace/repair" className="btn-gold inline-block px-8 py-3 font-semibold">Sign in</Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
