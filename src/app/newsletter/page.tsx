import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { listAllIssues, listSentIssues, NEWSLETTER_NAME, newsletterReader } from "@/lib/newsletter";
import { issueMonthLabel } from "@/lib/newsletter-sections";

export const metadata: Metadata = {
  title: "The RIHOSO Monthly",
  description: "RIHOSO's members-only monthly newsletter: new releases, watch events, makers, brands, repairs and the good life.",
};
export const dynamic = "force-dynamic";

const STATUS_NOTE: Record<string, string> = { draft: "Draft", approved: "Approved — not sent yet", sending: "Sending", cancelled: "Cancelled" };

export default async function NewsletterIndex() {
  const reader = await newsletterReader();
  const issues = reader.admin ? await listAllIssues() : await listSentIssues();

  return (
    <>
      <PageHero
        eyebrow="Members Only"
        title={NEWSLETTER_NAME}
        subtitle="Each month: new releases, watch events around the world, a watchmaker, an independent and a major brand, a local store, repair notes, and our picks for the table, the glass and the road."
      />
      <section className="py-16 sm:py-20 bg-forest-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {!reader.user && (
            <div className="rounded-xl border border-gold-400/20 bg-forest-900/60 p-8 text-center">
              <h2 className="font-display text-2xl text-cream-50">Members, sign in to read</h2>
              <p className="mt-3 text-cream-300">Use the email address your membership is under. We&apos;ll email you a one-time code, no password needed.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/marketplace/sign-in?next=/newsletter" className="px-6 py-3 rounded bg-gold-400 text-forest-950 font-semibold hover:bg-gold-300 transition-colors">Sign in</Link>
                <Link href="/memberships#join" className="px-6 py-3 rounded border border-gold-400/50 text-gold-300 hover:bg-gold-400/10 transition-colors">Become a member</Link>
              </div>
            </div>
          )}
          {reader.user && !reader.member && (
            <div className="rounded-xl border border-gold-400/20 bg-forest-900/60 p-8 text-center">
              <h2 className="font-display text-2xl text-cream-50">The newsletter is for RIHOSO members</h2>
              <p className="mt-3 text-cream-300">
                You&apos;re signed in as {reader.user.email}, which isn&apos;t on an active membership. If you joined under another email, sign out and sign in with that one.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/memberships#join" className="px-6 py-3 rounded bg-gold-400 text-forest-950 font-semibold hover:bg-gold-300 transition-colors">Become a member</Link>
              </div>
            </div>
          )}

          {(reader.member || !reader.user) && (
            <div className={reader.user ? "" : "mt-14"}>
              <h2 className="text-gold-400 uppercase tracking-[0.25em] text-xs mb-4">{reader.member ? "All issues" : "Recent issues"}</h2>
              {issues.length === 0 ? (
                <p className="text-cream-300">The first issue arrives December 1, 2026.</p>
              ) : (
                <ul className="divide-y divide-forest-600/40 border-y border-forest-600/40">
                  {issues.map((i) => (
                    <li key={i.id}>
                      <Link href={`/newsletter/${i.slug}`} className="block py-5 group">
                        <span className="text-xs uppercase tracking-widest text-cream-400">
                          {issueMonthLabel(i.issue_date)}
                          {i.status !== "sent" && <span className="ml-2 text-gold-300">· {STATUS_NOTE[i.status] ?? i.status}</span>}
                        </span>
                        <span className="block font-display text-2xl text-cream-50 group-hover:text-gold-300 transition-colors">{i.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {reader.admin && (
                <p className="mt-6 text-sm text-cream-400">
                  You see drafts because you&apos;re an admin. <Link href="/marketplace/admin/newsletter" className="text-gold-400 underline">Review and approve issues</Link>.
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
