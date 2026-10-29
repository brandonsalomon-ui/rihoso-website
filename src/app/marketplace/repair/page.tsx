import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import ExchangeNav from "@/components/exchange/ExchangeNav";
import RepairRequestForm from "@/components/exchange/RepairRequestForm";
import { REPAIRS_OPEN, SERVICES } from "@/lib/marketplace";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Watch Repair", description: SERVICES.repair.summary };
export const dynamic = "force-dynamic";

const STEPS = [
  { title: "Tell us about it", body: "Describe the watch and what's wrong, add a few photos, and choose how you'd like us to reach you." },
  { title: "We review it", body: "RIHOSO looks over your request and gets back to you by email, phone or text with a price or questions." },
  { title: "You decide", body: "Approve the written quote and pay securely online, then we'll arrange drop-off or insured shipping." },
];

export default async function RepairPage() {
  const { user } = await getUser();
  return (
    <>
      <PageHero eyebrow="Watch Exchange" title="Repair & Service" subtitle={SERVICES.repair.summary} />
      <ExchangeNav signedIn={Boolean(user)} />
      <section className="py-14 bg-forest-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {!REPAIRS_OPEN ? (
            <div className="panel-lux rounded-xl p-8 text-center text-cream-200">
              Repair requests aren&apos;t open yet. Please check back soon.
            </div>
          ) : (
            <>
              <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="card-lux rounded-xl p-5">
                    <p className="text-gold-400 font-display text-2xl mb-1">{i + 1}</p>
                    <h2 className="font-display text-lg text-cream-50 mb-1">{s.title}</h2>
                    <p className="text-sm text-cream-300 leading-relaxed">{s.body}</p>
                  </li>
                ))}
              </ol>
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
