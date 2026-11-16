import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import PageHero from "@/components/PageHero";
import { formatUsd } from "@/lib/marketplace";
import { finalizeMembershipCheckout, formatDate, type Membership } from "@/lib/memberships";
import { isStripeConfigured } from "@/lib/stripe";

export const metadata: Metadata = { title: "Thank you for sponsoring", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SponsorThanks({ searchParams }: { searchParams: { session_id?: string } }) {
  const sessionId = searchParams.session_id ?? "";
  if (!isStripeConfigured() || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) redirect("/sponsor");

  let membership: Membership | null = null;
  try {
    const host = headers().get("x-forwarded-host") ?? headers().get("host");
    const base = process.env.NEXT_PUBLIC_SITE_URL || (host ? `https://${host}` : "https://rihoso.com");
    membership = await finalizeMembershipCheckout(sessionId, base);
  } catch (err) {
    console.error("[sponsor] finalize failed", err);
  }
  const paid = membership?.status === "paid" && membership.period_end;

  return (
    <>
      <PageHero eyebrow="Rhode Island Horological Society" title="Thank you for sponsoring" />
      <section className="py-20 bg-forest-800 min-h-[40vh]">
        <div className="max-w-lg mx-auto px-4 text-center panel-lux rounded-xl p-8 space-y-4">
          {paid && membership ? (
            <>
              <p className="text-cream-100 text-lg">
                Thank you, {membership.full_name.split(/\s+/)[0]}. Your {formatUsd(membership.amount_cents)} sponsorship is
                confirmed.
              </p>
              <p className="text-cream-300">
                Your RIHOSO membership is active until {formatDate(membership.period_end!)}. A confirmation and welcome
                letter are on their way to your email. To use member benefits on rihoso.com, sign in with that email (we
                send a 6-digit code, no password).
              </p>
            </>
          ) : (
            <p className="text-cream-300">
              We&apos;re confirming your payment. This can take a moment. You&apos;ll get an email as soon as it&apos;s done.
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/events" className="btn-gold px-6 py-3 font-semibold">Upcoming events</Link>
            <Link href="/marketplace/account" className="px-6 py-3 rounded border border-cream-200/30 text-cream-100 hover:border-gold-400">
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
