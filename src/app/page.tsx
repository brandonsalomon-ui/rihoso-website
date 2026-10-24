import { Suspense } from "react";
import Link from "next/link";
import NewsGrid from "@/components/NewsGrid";
import SectionHeading from "@/components/SectionHeading";
import Logo from "@/components/Logo";
import { upcomingEvents } from "@/lib/events";
import Reveal from "@/components/Reveal";
import LiveDial from "@/components/LiveDial";
import { Gear, GuillocheRosette, Icon, WatchDial, type IconName } from "@/components/ornaments";

const PILLARS: { label: string; icon: IconName }[] = [
  { label: "Time", icon: "time" },
  { label: "History", icon: "history" },
  { label: "Art", icon: "art" },
  { label: "Science", icon: "science" },
  { label: "Education", icon: "education" },
  { label: "Tradition", icon: "tradition" },
];

// Re-check dates every hour so past events drop off automatically.
export const revalidate = 3600;



export default function HomePage() {
  const homeEvents = upcomingEvents().slice(0, 3);
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Atmosphere */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(201,168,76,0.16),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(8,15,8,0.8),transparent_60%)]" />

        {/* Engine-turned rosette and chapter ring behind the seal */}
        <div className="pointer-events-none absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-gold-400/[0.09]">
          <GuillocheRosette className="w-[720px] h-[720px] sm:w-[900px] sm:h-[900px] animate-rotate-slow" petals={48} />
        </div>
        <div className="pointer-events-none absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-gold-400/[0.07]">
          <WatchDial className="w-[480px] h-[480px] sm:w-[560px] sm:h-[560px]" hands={false} />
        </div>

        {/* Gear train in the corners */}
        <div className="pointer-events-none absolute -left-28 top-24 text-gold-400/[0.08] hidden sm:block">
          <Gear className="w-80 h-80 animate-rotate-slow" teeth={32} />
        </div>
        <div className="pointer-events-none absolute left-36 top-72 text-gold-400/[0.07] hidden lg:block">
          <Gear className="w-36 h-36 animate-rotate-slow-reverse" teeth={14} />
        </div>
        <div className="pointer-events-none absolute -right-24 bottom-10 text-gold-400/[0.08]">
          <Gear className="w-72 h-72 animate-rotate-slow-reverse" teeth={28} />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div
            className="flex justify-center mb-8 animate-fade-in-up opacity-0"
            style={{ animationFillMode: "forwards" }}
          >
            <Logo size="large" />
          </div>

          <p
            className="font-display text-xl sm:text-2xl lg:text-3xl text-cream-200 leading-relaxed animate-fade-in-up opacity-0 animation-delay-200"
            style={{ animationFillMode: "forwards" }}
          >
            Time, History, Art, Science, Education, and Tradition.
          </p>
          <p
            className="mt-2 font-body text-lg sm:text-xl text-gold-400 tracking-wide animate-fade-in-up opacity-0 animation-delay-400"
            style={{ animationFillMode: "forwards" }}
          >
            Preserving the Legacy of Horology
          </p>

          <div
            className="mt-12 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up opacity-0 animation-delay-600"
            style={{ animationFillMode: "forwards" }}
          >
            <Link
              href="/memberships#join"
              className="btn-gold px-8 py-4 font-body text-lg tracking-widest uppercase"
            >
              Become a Member
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 border border-cream-300/30 text-cream-200 font-body text-lg tracking-widest uppercase hover:border-gold-400 hover:text-gold-400 hover:bg-gold-400/5 transition-colors duration-300"
            >
              Learn More
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-forest-800 to-transparent" />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gold-400/70 text-[10px] tracking-[0.35em] uppercase">
          <span>Scroll</span>
          <span className="h-10 w-px bg-gradient-to-b from-gold-400/80 to-transparent animate-pulse" />
        </div>
      </section>

      {/* Six pillars from the society's motto */}
      <section className="relative border-y border-gold-400/15 bg-forest-900/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="grid grid-cols-3 lg:grid-cols-6 divide-x divide-gold-400/10">
            {PILLARS.map((p, i) => (
              <Reveal as="li" key={p.label} delay={i * 90} className="group">
                <div className="flex flex-col items-center gap-3 py-8 sm:py-10 text-center">
                  <span className="flex items-center justify-center w-14 h-14 rounded-full border border-gold-400/30 text-gold-400 group-hover:border-gold-300 group-hover:bg-gold-400/10 group-hover:text-gold-200 transition-all duration-500 group-hover:-translate-y-1">
                    <Icon name={p.icon} className="w-7 h-7" />
                  </span>
                  <span className="font-display text-cream-100 tracking-[0.15em] uppercase text-xs sm:text-sm">{p.label}</span>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Events Preview */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <SectionHeading
          title="Upcoming Events"
          subtitle="Gatherings for collectors, enthusiasts, and students of horology"
        />

        <div
          className={`mt-16 grid grid-cols-1 gap-8 ${
            homeEvents.length >= 3 ? "md:grid-cols-3" : homeEvents.length === 2 ? "md:grid-cols-2 max-w-4xl mx-auto" : "max-w-xl mx-auto"
          }`}
        >
          {homeEvents.map((event, i) => (
            <Reveal key={i} delay={i * 120} className="h-full">
            <div className="card-lux group h-full rounded-xl p-8 overflow-hidden">
              <span className="absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-gold-300 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
              <div className="flex items-center gap-3 mb-5">
                <span className="flex items-center justify-center w-11 h-11 rounded-full border border-gold-400/40 text-gold-400 group-hover:bg-gold-400 group-hover:text-forest-950 transition-colors duration-300">
                  <Icon name={event.recurring ? "repeat" : "calendar"} className="w-5 h-5" />
                </span>
                <span className="text-gold-400 font-body text-sm tracking-widest uppercase leading-snug">
                  {event.date}
                </span>
              </div>
              <h3 className="font-display text-xl text-cream-100 group-hover:text-gold-300 transition-colors duration-300">
                {event.shortTitle || event.title}
              </h3>
              <p className="mt-2 flex items-center gap-1.5 text-cream-400 font-body text-sm">
                <Icon name="pin" className="w-4 h-4 text-gold-400/80" />
                {event.location}
              </p>
              <p className="mt-4 text-cream-300 font-body leading-relaxed">
                {event.shortDescription || event.description}
              </p>
            </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-gold-400 font-body tracking-wide hover:text-gold-300 transition-colors group"
          >
            View All Events
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* News Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-forest-900/40 border-y border-gold-400/10 overflow-hidden">
        <div className="absolute inset-0 bg-guilloche opacity-50 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto">
          <SectionHeading
            title="Watch World News"
            subtitle="The latest from the world of horology and watchmaking"
          />

          <div className="mt-16">
            <Suspense
              fallback={
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-forest-800/50 border border-forest-600/30 animate-pulse"
                    >
                      <div className="aspect-[16/10] bg-forest-700/30" />
                      <div className="p-5 space-y-3">
                        <div className="h-3 bg-forest-700/50 rounded w-1/3" />
                        <div className="h-5 bg-forest-700/50 rounded w-full" />
                        <div className="h-4 bg-forest-700/50 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              }
            >
              <NewsGrid />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Membership CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <Reveal className="relative max-w-5xl mx-auto overflow-hidden rounded-2xl panel-lux">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(201,168,76,0.18),transparent_55%)]" />
          <div className="relative grid md:grid-cols-[1.4fr_1fr] items-center gap-8 px-8 py-14 sm:px-14">
            <div className="text-center md:text-left">
              <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">Membership</p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl text-cream-50 font-bold">
                Join the <span className="text-gold-foil">Society</span>
              </h2>
              <p className="mt-6 font-body text-xl text-cream-300 leading-relaxed">
                Connect with fellow horologists, attend exclusive events, and help preserve
                the art and science of timekeeping for future generations.
              </p>
              <Link
                href="/memberships"
                className="btn-gold mt-10 inline-flex items-center gap-3 px-10 py-4 font-body text-lg tracking-widest uppercase"
              >
                Explore Membership
                <Icon name="arrow" className="w-5 h-5" />
              </Link>
            </div>
            <div className="relative hidden md:flex items-center justify-center">
              <div className="absolute text-gold-400/15">
                <GuillocheRosette className="w-80 h-80 animate-rotate-slow" />
              </div>
              <div className="relative text-gold-300/80 drop-shadow-[0_0_30px_rgba(201,168,76,0.25)]">
                <LiveDial className="w-60 h-60" />
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
