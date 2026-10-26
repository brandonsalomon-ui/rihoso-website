import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import PageHero from "@/components/PageHero";
import { finalizeMembershipCheckout, formatDate } from "@/lib/memberships";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Welcome to RIHOSO", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MembershipWelcome({ searchParams }: { searchParams: { session_id?: string } }) {
  if (!isSupabaseConfigured()) redirect("/memberships");
  const { user } = await getUser();
  const sessionId = searchParams.session_id ?? "";
  if (!user || !/^cs_/.test(sessionId)) redirect("/memberships");

  let until: string | null = null;
  try {
    const host = headers().get("x-forwarded-host") ?? headers().get("host");
    const base = process.env.NEXT_PUBLIC_SITE_URL || (host ? `https://${host}` : "https://rihoso.com");
    const membership = await finalizeMembershipCheckout(sessionId, base);
    if (membership && membership.user_id === user.id && membership.status === "paid" && membership.period_end) {
      until = membership.period_end;
    }
  } catch (err) {
    console.error("[membership] finalize failed", err);
  }

  return (
    <>
      <PageHero eyebrow="Rhode Island Horological Society" title={until ? "Welcome, member" : "Thank you"} />
      <section className="py-20 bg-forest-800 min-h-[40vh]">
        <div className="max-w-lg mx-auto px-4 text-center panel-lux rounded-xl p-8 space-y-4">
          {until ? (
            <>
              <p className="text-cream-100 text-lg">Your membership is active until {formatDate(until)}.</p>
              <p className="text-cream-300 text-sm">
                Your Watch Exchange selling fee is now 5%. Membership doesn&apos;t renew automatically — we&apos;ll email you
                before it ends. A confirmation email is on its way.
              </p>
            </>
          ) : (
            <p className="text-cream-300">
              We&apos;re confirming your payment. This can take a moment — you&apos;ll get an email as soon as your membership
              is active.
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/events" className="btn-gold px-6 py-3 font-semibold">Upcoming events</Link>
            <Link href="/marketplace" className="px-6 py-3 rounded border border-cream-200/30 text-cream-100 hover:border-gold-400">
              Watch Exchange
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
