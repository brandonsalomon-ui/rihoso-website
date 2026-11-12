import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import NewsletterIssue, { IssueContents } from "@/components/NewsletterIssue";
import PageHero from "@/components/PageHero";
import { getIssueBySlug, issueProblems, NEWSLETTER_NAME, newsletterReader } from "@/lib/newsletter";
import { issueMonthLabel } from "@/lib/newsletter-sections";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const issue = await getIssueBySlug(params.slug);
  if (!issue || issue.status !== "sent") return { title: NEWSLETTER_NAME, robots: { index: false } };
  return { title: `${NEWSLETTER_NAME} — ${issueMonthLabel(issue.issue_date)}`, description: issue.title, robots: { index: false } };
}

export default async function NewsletterIssuePage({ params }: { params: { slug: string } }) {
  const [issue, reader] = await Promise.all([getIssueBySlug(params.slug), newsletterReader()]);
  if (!issue || issue.status === "cancelled") notFound();
  if (issue.status !== "sent" && !reader.admin) notFound();
  const month = issueMonthLabel(issue.issue_date);
  const next = `/newsletter/${issue.slug}`;

  if (!reader.member) {
    return (
      <>
        <PageHero eyebrow={`${NEWSLETTER_NAME} · ${month}`} title={issue.title} />
        <section className="py-14 sm:py-20 bg-forest-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-gold-400/25 bg-forest-900/70 p-8 text-center">
              <h2 className="font-display text-2xl text-cream-50">{reader.user ? "This issue is for RIHOSO members" : "Members, sign in to read the full issue"}</h2>
              <p className="mt-3 text-cream-300">
                {reader.user
                  ? `You're signed in as ${reader.user.email}, which isn't on an active membership. If you joined under another email, sign out and sign in with that one.`
                  : "Use the email address your membership is under. We'll email you a one-time code, no password needed."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {!reader.user && (
                  <Link href={`/marketplace/sign-in?next=${encodeURIComponent(next)}`} className="px-6 py-3 rounded bg-gold-400 text-forest-950 font-semibold hover:bg-gold-300 transition-colors">Sign in</Link>
                )}
                <Link href="/memberships#join" className={`px-6 py-3 rounded transition-colors ${reader.user ? "bg-gold-400 text-forest-950 font-semibold hover:bg-gold-300" : "border border-gold-400/50 text-gold-300 hover:bg-gold-400/10"}`}>
                  Become a member
                </Link>
              </div>
            </div>
            <div className="mt-12">
              <h2 className="font-display text-2xl text-cream-50 mb-6">In this issue</h2>
              <IssueContents issue={issue} teaser />
            </div>
          </div>
        </section>
      </>
    );
  }

  const todo = reader.admin && issue.status !== "sent" ? issueProblems(issue) : [];
  return (
    <>
      {reader.admin && issue.status !== "sent" && (
        <div className="bg-gold-400/15 border-b border-gold-400/30 text-cream-100 text-sm">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <strong>Preview ({issue.status}).</strong> Members can&apos;t see this until it goes out.{" "}
            <Link href={`/marketplace/admin/newsletter?issue=${issue.slug}`} className="underline text-gold-300">Edit and approve</Link>
            {todo.length > 0 && <span className="block mt-1 text-cream-300">Still to do: {todo.join(" · ")}</span>}
          </div>
        </div>
      )}
      <PageHero eyebrow={`${NEWSLETTER_NAME} · ${month}`} title={issue.title} />
      <NewsletterIssue issue={issue} showPlaceholders={reader.admin} />
    </>
  );
}
