import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { verifyUnsubscribe } from "@/lib/member-mail";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Shows a confirm button rather than unsubscribing on page load, so email link-scanners can't remove people. */
export default function UnsubscribePage({ searchParams }: { searchParams: { e?: string; t?: string; done?: string } }) {
  const done = searchParams.done === "1";
  const email = done ? null : verifyUnsubscribe(searchParams.e ?? null, searchParams.t ?? null);

  return (
    <>
      <PageHero eyebrow="Rhode Island Horological Society" title={done ? "You're unsubscribed" : "Unsubscribe"} />
      <section className="py-20 bg-forest-800 min-h-[40vh]">
        <div className="max-w-lg mx-auto px-4 text-center panel-lux rounded-xl p-8 space-y-4">
          {done ? (
            <>
              <p className="text-cream-100 text-lg">You won&apos;t receive RIHOSO announcements any more.</p>
              <p className="text-cream-300 text-sm">
                We&apos;ll still send anything tied to your own membership, RSVPs or Watch Exchange orders. Changed your mind?
                Email <a href="mailto:membership@rihoso.com" className="text-gold-300 hover:underline">membership@rihoso.com</a>.
              </p>
            </>
          ) : email ? (
            <>
              <p className="text-cream-100">
                Stop RIHOSO announcement emails to <span className="text-gold-300">{email}</span>?
              </p>
              <form method="post" action="/api/unsubscribe">
                <input type="hidden" name="e" value={searchParams.e} />
                <input type="hidden" name="t" value={searchParams.t} />
                <button type="submit" className="btn-gold px-6 py-3 rounded font-semibold">
                  Unsubscribe
                </button>
              </form>
            </>
          ) : (
            <p className="text-cream-300">
              This link isn&apos;t valid. To stop RIHOSO emails, reply to any of them or write to{" "}
              <a href="mailto:membership@rihoso.com" className="text-gold-300 hover:underline">membership@rihoso.com</a>.
            </p>
          )}
          <p className="pt-2">
            <Link href="/" className="text-sm text-cream-400 hover:text-gold-300">Back to rihoso.com</Link>
          </p>
        </div>
      </section>
    </>
  );
}
