import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import SponsorTonightForm from "@/components/SponsorTonightForm";
import { tonightsEvent } from "@/lib/events";
import { SPONSOR_TERM_MONTHS } from "@/lib/sponsorship";

export const metadata: Metadata = {
  title: "Sponsor Tonight's Event",
  description: `Sponsor tonight's RIHOSO gathering: Partial Sponsor $250 or Full Sponsor $500, each with a ${SPONSOR_TERM_MONTHS / 12}-year membership.`,
};
// Re-checked on every visit so "tonight" is always today's event.
export const dynamic = "force-dynamic";

export default function SponsorTonightPage() {
  const event = tonightsEvent();
  return (
    <>
      <PageHero
        eyebrow="Rhode Island Horological Society"
        title="Sponsor Tonight's Event"
        subtitle={
          event
            ? `${event.shortTitle ?? event.title} · ${event.location}`
            : "Your sponsorship keeps RIHOSO gatherings, talks and programs going."
        }
      />
      <section className="py-16 sm:py-20 bg-forest-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center mb-10">
          <p className="text-cream-200 text-lg">
            Thank you for supporting the Society. Every sponsorship includes a{" "}
            <strong className="text-cream-50">{SPONSOR_TERM_MONTHS / 12}-year RIHOSO membership</strong>. All proceeds go to the
            Society, funding scholarships and operating expenses.
          </p>
        </div>
        <div className="px-4 sm:px-6">
          <SponsorTonightForm />
        </div>
      </section>
    </>
  );
}
