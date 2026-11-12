import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ExchangeNav from "@/components/exchange/ExchangeNav";
import NewsletterEditor from "@/components/admin/NewsletterEditor";
import { todayInRI } from "@/lib/events";
import { issueProblems, listAllIssues, newsletterPhotoUrl } from "@/lib/newsletter";
import { issueMonthLabel } from "@/lib/newsletter-sections";
import { isAdmin } from "@/lib/orders";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Newsletter", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  draft: "Draft — needs your approval",
  approved: "Approved — goes out on its date",
  sending: "Sending…",
  sent: "Sent",
  cancelled: "Cancelled",
};

export default async function NewsletterAdminPage({ searchParams }: { searchParams: { issue?: string } }) {
  const { user } = await getUser();
  if (!user) redirect("/marketplace/sign-in?next=/marketplace/admin/newsletter");
  if (!(await isAdmin(user.id))) notFound();

  let issues: Awaited<ReturnType<typeof listAllIssues>> = [];
  let ready = true;
  try {
    issues = await listAllIssues();
  } catch {
    ready = false;
  }
  const selected =
    issues.find((i) => i.slug === searchParams.issue) ??
    issues.find((i) => i.status === "draft" || i.status === "approved") ??
    issues[0] ??
    null;

  // Months that don't have an issue yet (this month and the next two), for starting one by hand.
  const today = todayInRI();
  const [y, m] = today.split("-").map(Number);
  const openMonths = [0, 1, 2]
    .map((k) => {
      const d = new Date(Date.UTC(y, m - 1 + k, 1));
      return d.toISOString().slice(0, 10);
    })
    .filter((d) => !issues.some((i) => i.issue_date === d));

  return (
    <>
      <ExchangeNav signedIn />
      <section className="py-12 bg-forest-800 min-h-[70vh]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-gold-400 text-xs uppercase tracking-[0.2em]">RIHOSO only</p>
              <h1 className="font-display text-3xl text-cream-50">The RIHOSO Monthly</h1>
              <p className="text-sm text-cream-400 mt-1">
                The writer drafts each issue around the 25th. Add photos, edit anything, then approve. Approved issues email members at 9 AM on the 1st.
              </p>
            </div>
            <Link href="/marketplace/admin" className="text-sm text-cream-300 hover:text-gold-300">← Back to admin</Link>
          </div>

          {!ready ? (
            <p className="text-sm text-red-200">The newsletter isn&apos;t switched on yet: the database update (migration 0011) still needs to be applied.</p>
          ) : (
            <>
              {issues.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {issues.map((i) => (
                    <Link
                      key={i.id}
                      href={`/marketplace/admin/newsletter?issue=${i.slug}`}
                      className={`px-4 py-2 rounded border text-sm ${selected?.id === i.id ? "border-gold-400 text-gold-200 bg-gold-400/10" : "border-forest-600/50 text-cream-300 hover:border-gold-400/50"}`}
                    >
                      {issueMonthLabel(i.issue_date)} · <span className="text-cream-400">{i.status}</span>
                    </Link>
                  ))}
                </div>
              )}

              {selected ? (
                <NewsletterEditor
                  key={selected.id}
                  issue={selected}
                  statusLabel={STATUS[selected.status] ?? selected.status}
                  todo={issueProblems(selected)}
                  photoBase={newsletterPhotoUrl("")}
                  adminEmail={user.email ?? ""}
                  openMonths={openMonths}
                />
              ) : (
                <NewsletterEditor issue={null} statusLabel="" todo={[]} photoBase={newsletterPhotoUrl("")} adminEmail={user.email ?? ""} openMonths={openMonths} />
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
