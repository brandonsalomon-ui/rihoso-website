import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import PartnerList from "@/components/partners/PartnerList";
import PartnerSignupForm from "@/components/partners/PartnerSignupForm";
import { formatUsd } from "@/lib/marketplace";
import { formatDate } from "@/lib/memberships";
import {
  FEE_SCHEDULE_TEXT,
  PARTNER_PRICE_CENTS,
  PARTNER_TERM_MONTHS,
  QUOTE_WINDOW_HOURS,
  RENEW_WINDOW_DAYS,
} from "@/lib/repair-partner-rules";
import { activePartners, canPay, getPartnerForUser } from "@/lib/repair-partners";
import { isStripeConfigured } from "@/lib/stripe";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Repair Partners",
  description:
    "RIHOSO's repair partners are independent workshops who quote on repair requests sent through the Society. Customers compare quotes and choose.",
};
export const dynamic = "force-dynamic";

const PRICE = formatUsd(PARTNER_PRICE_CENTS);

const TERMS = [
  `The partnership is ${PRICE} for ${PARTNER_TERM_MONTHS / 12} year, starting the day RIHOSO approves your application. It doesn't renew automatically; you can renew from your dashboard in the last ${RENEW_WINDOW_DAYS} days.`,
  "RIHOSO reviews every application. If yours isn't approved, the payment is refunded in full.",
  `Customers choose which partners quote on their request. Please quote, or decline, within ${QUOTE_WINDOW_HOURS} hours.`,
  "Quotes include the price, what it covers, turnaround and warranty. You may confirm or adjust the price after examining the watch; the customer approves the final price.",
  `RIHOSO's referral fee is included in your quoted price: ${FEE_SCHEDULE_TEXT}. It's due on every job you're chosen for.`,
  "You receive the customer's contact details only when they choose you. Please keep RIHOSO leads on RIHOSO and contact the customer within one business day.",
  "You're responsible for your work, pricing, warranty and the watch while it's in your care. RIHOSO introduces customers and isn't a party to the repair.",
  "RIHOSO doesn't take Rolex, Tudor or Patek Philippe repairs through this program.",
  "RIHOSO may pause or end a partnership for poor service or complaints; unused time is refunded pro rata if RIHOSO ends it without cause.",
];

export default async function RepairPartnersPage() {
  const partners = isSupabaseConfigured() ? await activePartners().catch(() => []) : [];
  const { user } = isSupabaseConfigured() ? await getUser() : { user: null };
  const mine = user ? await getPartnerForUser(user.id).catch(() => null) : null;
  const payOk = canPay(mine);

  return (
    <>
      <PageHero
        eyebrow="Watch Repair"
        title="Our Repair Partners"
        subtitle="Independent workshops who quote on repairs sent through RIHOSO. You choose who quotes, compare the quotes side by side, and pick the one you prefer."
      >
        <Link href="/marketplace/repair" className="text-gold-400 hover:text-gold-300 text-sm">Get your free quotes →</Link>
      </PageHero>

      <section className="py-16 sm:py-20 bg-forest-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <PartnerList partners={partners} />
        </div>
      </section>

      <section id="join" className="py-16 sm:py-20 bg-forest-900 border-t border-gold-400/10 scroll-mt-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center">
            <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">For workshops</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-cream-50">Become a Repair Partner</h2>
            <p className="mt-4 text-cream-200 text-lg">
              Receive qualified repair requests, with photos, from Rhode Island collectors. {PRICE} a year; you quote only on the
              requests you want, through your own partner dashboard.
            </p>
          </div>

          <div className="panel-lux rounded-xl p-6 sm:p-8">
            <h3 className="font-display text-xl text-cream-50 mb-3">Repair Partner terms</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-cream-200">
              {TERMS.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>

          {!isStripeConfigured() ? (
            <p className="text-center text-cream-300">Partner sign-up opens soon.</p>
          ) : !user?.email ? (
            <div className="panel-lux rounded-xl p-8 text-center">
              <p className="text-cream-200 mb-6">
                Sign in with the email address your workshop will use for leads. We&apos;ll send a 6-digit code; there&apos;s no
                password.
              </p>
              <Link href="/marketplace/sign-in?next=/repair-partners%23join" className="btn-gold inline-block px-8 py-3 font-semibold">
                Sign in to apply
              </Link>
            </div>
          ) : mine && !payOk ? (
            <div className="panel-lux rounded-xl p-8 text-center space-y-3">
              <p className="text-cream-100 text-lg">
                {mine.status === "pending_approval"
                  ? `Thank you — ${mine.business_name}'s application is paid and waiting for RIHOSO's approval.`
                  : `${mine.business_name} is a RIHOSO Repair Partner${mine.period_end ? ` through ${formatDate(mine.period_end)}` : ""}.`}
              </p>
              <Link href="/partner" className="btn-gold inline-block px-8 py-3 font-semibold">Your partner dashboard</Link>
            </div>
          ) : (
            <>
              <p className="text-center text-sm text-cream-400">Signed in as {user.email} — this is the address that receives your leads.</p>
              <PartnerSignupForm
                initial={
                  mine
                    ? {
                        businessName: mine.business_name,
                        contactName: mine.contact_name,
                        phone: mine.phone ?? "",
                        website: mine.website ?? "",
                        city: mine.city ?? "",
                        address: mine.address ?? "",
                        blurb: mine.blurb ?? "",
                      }
                    : undefined
                }
                buttonLabel={mine?.approved_at && mine.status !== "declined" ? `Renew — ${PRICE}` : `Apply and pay ${PRICE}`}
              />
            </>
          )}
        </div>
      </section>
    </>
  );
}
