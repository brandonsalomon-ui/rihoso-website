import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { Icon, OrnamentDivider } from "@/components/ornaments";
import PhotoGallery from "@/components/PhotoGallery";
import { PHOTOS } from "@/lib/photos";
import EventRsvp from "@/components/EventRsvp";
import { nextMonthlyMeeting, todayInRI, upcomingEvents } from "@/lib/events";

function dayLabel(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
}

// Re-check dates every hour so past events drop off automatically.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Events & Gatherings",
  description: "Upcoming RIHOSO events, meetings, and horological gatherings in Rhode Island.",
};

export default function EventsPage() {
  const events = upcomingEvents();
  const nextMeeting = events.some((e) => e.recurring) ? nextMonthlyMeeting() : null;
  const hasDated = events.some((e) => !e.recurring);

  return (
    <>
      <PageHero
        eyebrow="Mark Your Calendar"
        title="Events & Gatherings"
        subtitle="Join us for meetings, workshops, fairs, and social events throughout the year."
        image={PHOTOS.membersDinner.src}
      >
        {nextMeeting && (
          <div className="inline-flex items-center gap-4 rounded-full border border-gold-400/30 bg-forest-950/50 backdrop-blur-sm pl-2 pr-6 py-2">
            <span className="flex items-center justify-center w-10 h-10 rounded-full btn-gold">
              <Icon name="calendar" className="w-5 h-5" />
            </span>
            <span className="text-left">
              <span className="block text-[11px] uppercase tracking-[0.25em] text-gold-400">Next members meeting</span>
              <span className="block font-display text-cream-50">{nextMeeting}</span>
            </span>
          </div>
        )}
      </PageHero>

      <section className="py-20 sm:py-24 bg-forest-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {events.length === 0 ? (
            <Reveal>
              <div className="relative overflow-hidden rounded-2xl panel-lux px-6 py-14 sm:px-12 text-center">
                <span className="mx-auto flex items-center justify-center w-16 h-16 rounded-full border border-gold-400/50 text-gold-300">
                  <Icon name="calendar" className="w-8 h-8" />
                </span>
                <h2 className="mt-6 font-display text-3xl text-cream-50">New gatherings coming soon</h2>
                <p className="mt-4 text-lg text-cream-300 max-w-xl mx-auto leading-relaxed">
                  We&apos;re planning our next events now. Become a member to be the first to hear when dates are announced.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/memberships#join" className="btn-gold inline-flex items-center justify-center gap-2 px-8 py-3 tracking-widest uppercase text-sm">
                    Become a member
                    <Icon name="arrow" className="w-4 h-4" />
                  </Link>
                  <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-3 tracking-widest uppercase text-sm border border-cream-300/30 text-cream-200 hover:border-gold-400 hover:text-gold-300 transition-colors">
                    Ask about events
                  </Link>
                </div>
              </div>
            </Reveal>
          ) : (
          <ol className="relative">
            {/* timeline spine */}
            <span
              aria-hidden="true"
              className="absolute left-5 sm:left-6 top-2 bottom-2 w-px bg-gradient-to-b from-gold-400/70 via-gold-400/25 to-transparent"
            />
            {events.map((event, i) => (
              <Reveal as="li" key={i} delay={i * 100} className="relative pl-16 sm:pl-20 pb-10 last:pb-0">
                <span className="absolute left-0 top-4 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-forest-900 border border-gold-400/60 text-gold-300 shadow-[0_0_0_6px_rgba(26,46,26,1)]">
                  <Icon name={event.recurring ? "repeat" : "calendar"} className="w-5 h-5" />
                </span>
                <div className="card-lux group rounded-xl p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <p className="text-gold-400 font-semibold tracking-[0.12em] uppercase text-sm">{event.date}</p>
                    {(event.recurring || event.badge) && (
                      <span className="text-[11px] uppercase tracking-[0.2em] bg-gold-400/15 text-gold-300 border border-gold-400/30 px-2.5 py-0.5 rounded-full">
                        {event.badge ?? "Recurring"}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 text-2xl font-display text-cream-50 group-hover:text-gold-200 transition-colors">
                    {event.title}
                  </h2>
                  <p className="mt-3 text-cream-300 leading-relaxed">{event.description}</p>
                  <div className="mt-5 pt-5 border-t border-gold-400/10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-cream-300">
                    <span className="inline-flex items-center gap-2">
                      <Icon name="clock" className="w-4 h-4 text-gold-400" />
                      {event.time}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Icon name="pin" className="w-4 h-4 text-gold-400" />
                      {event.location}
                    </span>
                    {event.recurring && nextMeeting && (
                      <span className="inline-flex items-center gap-2 text-gold-300">
                        <Icon name="calendar" className="w-4 h-4" />
                        Next: {nextMeeting}
                      </span>
                    )}
                  </div>
                  {event.photos && event.photos.length > 0 && (
                    <PhotoGallery
                      className="mt-6"
                      photos={event.photos}
                      layout={["row-span-2", "md:col-span-2", "row-span-2", "", "col-span-2 md:col-span-1"]}
                    />
                  )}
                  {event.rsvp && (
                    <EventRsvp
                      slug={event.rsvp.slug}
                      closesLabel={dayLabel(event.rsvp.closesOn)}
                      closed={todayInRI() > event.rsvp.closesOn}
                      membersOnly={event.badge === "Members"}
                    />
                  )}
                  {event.link && (
                    <Link
                      href={event.link.href}
                      className="mt-6 ml-0 mr-6 inline-flex items-center gap-2 text-gold-400 tracking-wide hover:text-gold-300 transition-colors"
                    >
                      {event.link.label}
                      <Icon name="arrow" className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </Reveal>
            ))}
          </ol>
          )}

          {events.length > 0 && !hasDated && (
            <p className="mt-10 text-center text-cream-300">
              More gatherings are being planned — check back soon.
            </p>
          )}

        </div>
      </section>

      <section className="py-20 sm:py-24 bg-forest-900/60 border-t border-gold-400/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">Past Gatherings</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-cream-50">From Our Recent Events</h2>
            <OrnamentDivider className="mt-6" />
          </Reveal>
          <Reveal>
            <PhotoGallery
              photos={[PHOTOS.presentation, PHOTOS.membersEvening, PHOTOS.movementDemo, PHOTOS.membersDinner, PHOTOS.demoConversation, PHOTOS.crowd]}
              layout={["md:row-span-2", "md:col-span-2", "md:row-span-2", "md:col-span-2", "md:col-span-2", "md:col-span-2"]}
            />
          </Reveal>
        </div>
      </section>

      <section className="pb-20 sm:pb-24 bg-forest-900/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="rounded-xl panel-lux px-6 py-8 sm:flex items-center justify-between gap-6 text-center sm:text-left">
              <p className="font-display text-xl text-cream-50">Want to hear about new events first?</p>
              <Link
                href="/memberships#join"
                className="btn-gold mt-5 sm:mt-0 inline-flex items-center gap-2 px-7 py-3 tracking-widest uppercase text-sm shrink-0"
              >
                Become a member
                <Icon name="arrow" className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
