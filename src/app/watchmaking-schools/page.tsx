import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import SchoolsExplorer from "@/components/SchoolsExplorer";
import Reveal from "@/components/Reveal";
import { Gear, Icon } from "@/components/ornaments";
import { SCHOOLS } from "@/lib/schools";
import { MAP_POINTS, US_NATION_PATH, US_STATES_PATH } from "@/lib/usMap";

export const metadata: Metadata = {
  title: "Watchmaking Schools",
  description: "Directory of watchmaking schools and horological education programs.",
};

function MapBase() {
  return (
    <g>
      <defs>
        <linearGradient id="landFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1f3a1f" />
          <stop offset="1" stopColor="#132613" />
        </linearGradient>
      </defs>
      <path d={US_NATION_PATH} fill="url(#landFill)" stroke="rgba(201,168,76,0.55)" strokeWidth="1.1" strokeLinejoin="round" />
      <path d={US_STATES_PATH} fill="none" stroke="rgba(201,168,76,0.16)" strokeWidth="0.6" strokeLinejoin="round" />
      {/* Compass rose */}
      <g transform="translate(905 520)" stroke="rgba(201,168,76,0.55)" fill="none">
        <circle r="30" strokeWidth="0.6" />
        <circle r="22" strokeWidth="0.4" />
        <path d="M0 -36 L5 -5 L0 0 L-5 -5 Z" fill="rgba(232,201,110,0.7)" stroke="none" />
        <path d="M0 36 L5 5 L0 0 L-5 5 Z" strokeWidth="0.8" />
        <path d="M-36 0 L-5 -5 L0 0 L-5 5 Z M36 0 L5 -5 L0 0 L5 5 Z" strokeWidth="0.8" />
        <text y="-42" textAnchor="middle" fontSize="11" fill="rgba(232,201,110,0.8)" stroke="none" fontFamily="'Playfair Display', serif">N</text>
      </g>
    </g>
  );
}

export default function WatchmakingSchoolsPage() {
  const states = new Set(SCHOOLS.map((s) => s.location.split(",").pop()?.trim())).size;

  return (
    <>
      <PageHero
        eyebrow="Education"
        title="Watchmaking Schools"
        subtitle="Interested in pursuing horology as a career or deepening your skills? Here are some of the top watchmaking programs in the United States."
      >
        <div className="inline-flex items-stretch divide-x divide-gold-400/20 border border-gold-400/20 rounded-lg bg-forest-950/40 backdrop-blur-sm">
          <div className="px-6 sm:px-8 py-3">
            <p className="font-display text-3xl text-gold-foil font-bold">{SCHOOLS.length}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-cream-300">Programs</p>
          </div>
          <div className="px-6 sm:px-8 py-3">
            <p className="font-display text-3xl text-gold-foil font-bold">{states}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-cream-300">States</p>
          </div>
          <a href="#map" className="group px-6 sm:px-8 py-3 flex flex-col items-center justify-center text-gold-400 hover:text-gold-200 transition-colors">
            <Icon name="pin" className="w-6 h-6 group-hover:-translate-y-0.5 transition-transform" />
            <p className="text-xs uppercase tracking-[0.2em] mt-1">See the map</p>
          </a>
        </div>
      </PageHero>

      <section id="map" className="relative py-16 sm:py-20 bg-forest-800 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SchoolsExplorer schools={SCHOOLS} home={MAP_POINTS.ri} mapBase={<MapBase />} />

          <Reveal className="mt-16">
            <Link
              href="/students"
              className="group card-lux rounded-xl px-6 py-8 sm:px-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left"
            >
              <span className="shrink-0 flex items-center justify-center w-16 h-16 rounded-full border border-gold-400/40 text-gold-400 group-hover:bg-gold-400 group-hover:text-forest-950 transition-colors duration-300">
                <Icon name="mentor" className="w-8 h-8" />
              </span>
              <span className="flex-1">
                <span className="block font-display text-2xl text-cream-50">Still in high school or college?</span>
                <span className="block mt-2 text-cream-300 text-lg">
                  RIHOSO&apos;s after-school program offers mentors, watchmaking basics, trips and scholarship guidance.
                </span>
              </span>
              <span className="inline-flex items-center gap-2 text-gold-400 tracking-wide group-hover:text-gold-300">
                Students &amp; Schools
                <Icon name="arrow" className="w-4 h-4" />
              </span>
            </Link>
          </Reveal>

          <Reveal className="mt-8">
            <div className="relative overflow-hidden rounded-xl panel-lux px-6 py-10 sm:px-12 text-center">
              <div className="pointer-events-none absolute -left-10 -top-10 text-gold-400/10">
                <Gear className="w-40 h-40 animate-rotate-slow" teeth={20} />
              </div>
              <div className="pointer-events-none absolute -right-8 -bottom-12 text-gold-400/10">
                <Gear className="w-48 h-48 animate-rotate-slow-reverse" teeth={26} />
              </div>
              <h2 className="relative font-display text-2xl sm:text-3xl text-cream-50">
                Know of a school that should be listed here?
              </h2>
              <p className="relative mt-3 text-cream-300 text-lg">
                Help us keep this directory complete for the next generation of watchmakers.
              </p>
              <Link
                href="/contact"
                className="btn-gold relative mt-7 inline-flex items-center gap-2 px-8 py-3 font-body tracking-widest uppercase"
              >
                Let us know
                <Icon name="arrow" className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
