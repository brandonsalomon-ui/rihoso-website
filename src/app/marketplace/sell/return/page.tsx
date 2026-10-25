import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { isStripeConfigured, signAccountId, verifyAccountId } from "@/lib/stripe";
import { isReady, syncSellerFromStripe } from "@/lib/sellers";

export const metadata: Metadata = { title: "Seller Setup", robots: { index: false } };
export const dynamic = "force-dynamic";

type Result = "ready" | "pending" | "incomplete" | "invalid";

async function checkAccount(account: string, sig: string): Promise<Result> {
  if (!isStripeConfigured() || !verifyAccountId(account, sig)) return "invalid";
  try {
    const acct = await syncSellerFromStripe(account);
    if (isReady(acct)) return "ready";
    if (acct.details_submitted) return "pending";
    return "incomplete";
  } catch {
    return "invalid";
  }
}

const COPY: Record<Result, { title: string; body: string }> = {
  ready: {
    title: "You're all set",
    body: "Your seller account is verified and ready to receive payouts. You can list your first watch now.",
  },
  pending: {
    title: "Thanks — we're reviewing your details",
    body: "Stripe is verifying your information. This usually takes a few minutes, occasionally a day or two. We'll email you if anything else is needed.",
  },
  incomplete: {
    title: "A few details still needed",
    body: "Your seller setup isn't finished yet. Pick up where you left off below.",
  },
  invalid: {
    title: "We couldn't find that sign-up",
    body: "The link may have expired. Please start seller sign-up again.",
  },
};

export default async function SellerReturnPage({
  searchParams,
}: {
  searchParams: { account?: string; sig?: string };
}) {
  const account = searchParams.account ?? "";
  const sig = searchParams.sig ?? "";
  const result = await checkAccount(account, sig);
  const copy = COPY[result];
  const resumeHref =
    result === "incomplete"
      ? `/api/marketplace/sellers/refresh?account=${encodeURIComponent(account)}&sig=${encodeURIComponent(signAccountId(account))}`
      : null;

  return (
    <>
      <PageHero eyebrow="Watch Exchange" title="Seller Setup" />
      <section className="py-20 sm:py-24 bg-forest-800">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center panel-lux rounded-xl p-8" role="status">
          <h2 className="text-2xl font-display text-cream-50 mb-3">{copy.title}</h2>
          <p className="text-cream-300 mb-8">{copy.body}</p>
          {resumeHref ? (
            <a href={resumeHref} className="btn-gold inline-block px-8 py-3 font-semibold">Continue setup</a>
          ) : result === "invalid" ? (
            <Link href="/marketplace/sell" className="btn-gold inline-block px-8 py-3 font-semibold">Start again</Link>
          ) : result === "ready" ? (
            <Link href="/marketplace/listings/new" className="btn-gold inline-block px-8 py-3 font-semibold">List a watch</Link>
          ) : (
            <Link href="/marketplace/account" className="text-gold-400 hover:text-gold-300">Go to my account</Link>
          )}
        </div>
      </section>
    </>
  );
}
