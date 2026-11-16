import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import PageHero from "@/components/PageHero";
import { formatDate } from "@/lib/memberships";
import { finalizePartnerCheckout, type RepairPartner } from "@/lib/repair-partners";
import { isStripeConfigured } from "@/lib/stripe";

export const metadata: Metadata = { title: "Repair Partner application", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PartnerThanks({ searchParams }: { searchParams: { session_id?: string } }) {
  const sessionId = searchParams.session_id ?? "";
  if (!isStripeConfigured() || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) redirect("/repair-partners");
  let partner: RepairPartner | null = null;
  try {
    const host = headers().get("x-forwarded-host") ?? headers().get("host");
    partner = await finalizePartnerCheckout(sessionId, process.env.NEXT_PUBLIC_SITE_URL || (host ? `https://${host}` : "https://rihoso.com"));
  } catch (err) {
    console.error("[repair-partners] finalize failed", err);
  }

  return (
    <>
      <PageHero eyebrow="Repair Partners" title="Thank you" />
      <section className="py-20 bg-forest-800 min-h-[40vh]">
        <div className="max-w-lg mx-auto px-4 text-center panel-lux rounded-xl p-8 space-y-4">
          {partner?.status === "pending_approval" ? (
            <p className="text-cream-100 text-lg">
              Your payment is received and {partner.business_name}&apos;s application is with RIHOSO. We&apos;ll email you as soon
              as you&apos;re approved; repair leads start then. If we can&apos;t approve it, the payment is refunded in full.
            </p>
          ) : partner?.status === "active" ? (
            <p className="text-cream-100 text-lg">
              Thank you — {partner.business_name} is a RIHOSO Repair Partner
              {partner.period_end ? ` through ${formatDate(partner.period_end)}` : ""}.
            </p>
          ) : (
            <p className="text-cream-300">We&apos;re confirming your payment. You&apos;ll get an email as soon as it&apos;s done.</p>
          )}
          <Link href="/partner" className="btn-gold inline-block px-8 py-3 font-semibold">Your partner dashboard</Link>
        </div>
      </section>
    </>
  );
}
