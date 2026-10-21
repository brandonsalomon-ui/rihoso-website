import type { Metadata } from "next";
import Link from "next/link";
import { nextMonthlyMeeting, upcomingEvents } from "@/lib/events";

// Re-check dates every hour so past events drop off automatically.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Events & Gatherings",
  description: "Upcoming RIHOSO events, meetings, and horological gatherings in Rhode Island.",
};

export default function EventsPage() {
  const events = upcomingEvents();
  const nextMeeting = nextMonthlyMeeting();
  const hasDated = events.some((e) => !e.recurring);

  return (
    <section className="py-20 bg-forest-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-gold-400 text-sm uppercase tracking-[0.2em] mb-2 text-center">
          Mark Your Calendar
        </p>
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-cream-50 mb-4 text-center">
          Events &amp; Gatherings
        </h1>
        <p className="text-center text-cream-300 mb-12 max-w-2xl mx-auto">
          Join us for meetings, workshops, fairs, and social events throughout the year.
        </p>

        <div className="space-y-6">
          {events.map((event, i) => (
            <div
              key={i}
              className="bg-forest-800/60 border border-forest-600/30 rounded-lg p-6 hover:border-gold-400/30 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="sm:w-48 shrink-0">
                  <p className="text-gold-400 font-semibold text-sm">{event.date}</p>
                  <p className="text-cream-400 text-sm">{event.time}</p>
                  {event.recurring && (
                    <>
                      <span className="inline-block mt-1 text-xs bg-gold-400/20 text-gold-300 px-2 py-0.5 rounded">
                        Recurring
                      </span>
                      {nextMeeting && (
                        <p className="mt-2 text-xs text-cream-300">Next: {nextMeeting}</p>
                      )}
                    </>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-display text-cream-100 mb-2">{event.title}</h3>
                  <p className="text-sm text-cream-300 mb-2">{event.description}</p>
                  <p className="text-xs text-cream-400">{event.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!hasDated && (
          <p className="mt-10 text-center text-cream-300">
            More gatherings are being planned — check back soon.
          </p>
        )}

        <p className="mt-10 text-center text-cream-400 text-sm">
          Want to hear about new events first?{" "}
          <Link href="/memberships#join" className="text-gold-400 hover:text-gold-300 transition-colors">
            Become a member
          </Link>
        </p>
      </div>
    </section>
  );
}
