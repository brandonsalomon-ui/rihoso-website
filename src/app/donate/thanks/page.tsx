import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PageHero from "@/components/PageHero";
import TikTokPurchase from "@/components/TikTokPurchase";
import { dollars, finalizeDonationCheckout, type Donation } from "@/lib/donations";
import { isStripeConfigured } from "@/lib/stripe";

export const metadata: Metadata = { title: "Thank you for your gift", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function DonateThanks({ searchParams }: { searchParams: { session_id?: string } }) {
  const sessionId = searchParams.session_id ?? "";
  if (!isStripeConfigured() || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) redirect("/#donate");

  let donation: Donation | null = null;
  try {
    donation = await finalizeDonationCheckout(sessionId);
  } catch (err) {
    console.error("[donate] finalize failed", err);
  }

  return (
    <>
      <PageHero eyebrow="Rhode Island Horological Society" title="Thank you for your gift" />
      <section className="py-20 bg-forest-800 min-h-[40vh]">
        <div className="max-w-lg mx-auto px-4 text-center panel-lux rounded-xl p-8 space-y-4">
          {donation?.paid ? (
            <>
              <p className="text-cream-100 text-lg">
                Thank you{donation.name ? `, ${donation.name.split(/\s+/)[0]}` : ""}. Your {dollars(donation.amountCents)} gift
                to RIHOSO is confirmed.
              </p>
              <p className="text-cream-300">
                Your support goes toward scholarships, education for the next generation of watchmakers, and the work of
                the society. A thank-you letter and receipt are on their way to your email.
              </p>
              <TikTokPurchase eventId={sessionId} value={donation.amountCents / 100} contentId="donation" contentName="RIHOSO Donation" />
            </>
          ) : (
            <p className="text-cream-300">
              We&apos;re confirming your gift. This can take a moment. You&apos;ll get an email as soon as it&apos;s done.
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/events" className="btn-gold px-6 py-3 font-semibold">Upcoming events</Link>
            <Link href="/memberships" className="px-6 py-3 rounded border border-cream-200/30 text-cream-100 hover:border-gold-400">
              Become a member
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
