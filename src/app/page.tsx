import { Suspense } from "react";
import Link from "next/link";
import NewsGrid from "@/components/NewsGrid";
import SectionHeading from "@/components/SectionHeading";
import Logo from "@/components/Logo";

const UPCOMING_EVENTS = [
  {
    title: "Monthly Members Meeting",
    date: "First Thursday of Each Month",
    location: "Rhode Island",
    description:
      "Join fellow horologists for discussions, show-and-tell, and guest presentations.",
  },
  {
    title: "Spring Horological Fair",
    date: "April 12, 2026",
    location: "Providence, RI",
    description:
      "Our signature event featuring vendors, exhibits, and educational workshops.",
  },
  {
    title: "Watchmaking Workshop",
    date: "May 17, 2026",
    location: "TBA",
    description:
      "Hands-on workshop covering movement assembly, cleaning, and maintenance.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Decorative clock face */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
          <svg
            viewBox="0 0 400 400"
            className="w-[800px] h-[800px] animate-rotate-slow text-gold-400"
          >
            <circle cx="200" cy="200" r="150" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="200" cy="200" r="120" fill="none" stroke="currentColor" strokeWidth="0.3" />
            <circle cx="200" cy="200" r="80" fill="none" stroke="currentColor" strokeWidth="0.5" />
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
              <line
                key={angle}
                x1={200 + 140 * Math.cos((angle * Math.PI) / 180)}
                y1={200 + 140 * Math.sin((angle * Math.PI) / 180)}
                x2={200 + 160 * Math.cos((angle * Math.PI) / 180)}
                y2={200 + 160 * Math.sin((angle * Math.PI) / 180)}
                stroke="currentColor"
                strokeWidth={angle % 90 === 0 ? "2" : "0.5"}
              />
            ))}
          </svg>
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
              href="/memberships"
              className="px-8 py-4 bg-gold-400 text-forest-900 font-body text-lg tracking-widest uppercase hover:bg-gold-300 transition-colors duration-300"
            >
              Become a Member
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 border border-cream-300/30 text-cream-200 font-body text-lg tracking-widest uppercase hover:border-gold-400 hover:text-gold-400 transition-colors duration-300"
            >
              Learn More
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-forest-800 to-transparent" />
      </section>

      {/* Events Preview */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <SectionHeading
          title="Upcoming Events"
          subtitle="Gatherings for collectors, enthusiasts, and students of horology"
        />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {UPCOMING_EVENTS.map((event, i) => (
            <div
              key={i}
              className="p-8 bg-forest-900/50 border border-forest-600/30 hover:border-gold-400/30 transition-all duration-500 group"
            >
              <div className="text-gold-400 font-body text-sm tracking-widest uppercase mb-3">
                {event.date}
              </div>
              <h3 className="font-display text-xl text-cream-100 group-hover:text-gold-300 transition-colors duration-300">
                {event.title}
              </h3>
              <p className="mt-1 text-cream-400 font-body text-sm">{event.location}</p>
              <p className="mt-4 text-cream-300 font-body leading-relaxed">
                {event.description}
              </p>
            </div>
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
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-forest-900/30">
        <div className="max-w-7xl mx-auto">
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
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-cream-50 font-bold">
            Join the Society
          </h2>
          <p className="mt-6 font-body text-xl text-cream-300 leading-relaxed max-w-2xl mx-auto">
            Connect with fellow horologists, attend exclusive events, and help preserve
            the art and science of timekeeping for future generations.
          </p>
          <Link
            href="/memberships"
            className="mt-10 inline-block px-10 py-4 bg-gold-400 text-forest-900 font-body text-lg tracking-widest uppercase hover:bg-gold-300 transition-colors duration-300"
          >
            Explore Membership
          </Link>
        </div>
      </section>
    </>
  );
}
