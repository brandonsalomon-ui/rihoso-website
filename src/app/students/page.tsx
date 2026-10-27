import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import StudentInterestForm from "@/components/StudentInterestForm";
import { PHOTOS } from "@/lib/photos";
import { Gear, Icon, OrnamentDivider, type IconName } from "@/components/ornaments";

export const metadata: Metadata = {
  title: "Students & Schools",
  description:
    "RIHOSO's after-school program gives high school and college students a pathway into horology: mentors, watchmaking basics, industry events, trips and scholarship guidance.",
};

const PROGRAM: { title: string; text: string; icon: IconName }[] = [
  { title: "Explore the industry", text: "A dedicated outlet to explore the watch world and your own horological interests.", icon: "time" },
  { title: "Watchmaking basics", text: "An introduction to watchmaking, watch brands and the history of timekeeping.", icon: "tools" },
  { title: "Mentors", text: "Mentor programs for future career development in the world of timepieces.", icon: "mentor" },
  { title: "Career pathways", text: "Vocational training and placement across the industry: retail, manufacturing, design and marketing.", icon: "handshake" },
  { title: "Scholarship guidance", text: "Scholarship opportunities and guidance for those heading into the watch industry.", icon: "education" },
  { title: "Meet industry leaders", text: "Special events with industry leaders, global companies and local businesses.", icon: "mic" },
  { title: "On-campus meetings", text: "Meetings and gatherings at school for society and club members.", icon: "users" },
  { title: "Off-campus trips", text: "Visits to businesses, museums and key points of interest.", icon: "pin" },
];

function Framed({ photo, className = "", sizes }: { photo: (typeof PHOTOS)[keyof typeof PHOTOS]; className?: string; sizes: string }) {
  return (
    <div className={`relative rounded-2xl p-[1px] bg-gradient-to-br from-gold-300/80 via-gold-500/30 to-gold-400/60 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] ${className}`}>
      <div className="relative w-full h-full rounded-[15px] overflow-hidden">
        <Image src={photo.src} alt={photo.alt} fill sizes={sizes} className="object-cover" style={{ objectPosition: photo.focus }} />
      </div>
    </div>
  );
}

export default function StudentsPage() {
  return (
    <>
      <PageHero
        eyebrow="RIHOSO for Schools"
        title="Students & Schools"
        subtitle="A pathway into horology for high school and college students — mentors, hands-on watchmaking, industry events and scholarship guidance."
        image={PHOTOS.gears.src}
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#interest" className="btn-gold px-8 py-4 tracking-widest uppercase inline-flex items-center justify-center gap-2">
            Get involved
            <Icon name="arrow" className="w-5 h-5" />
          </a>
          <Link
            href="/watchmaking-schools"
            className="px-8 py-4 border border-cream-300/30 text-cream-200 tracking-widest uppercase hover:border-gold-400 hover:text-gold-400 transition-colors"
          >
            Watchmaking schools
          </Link>
        </div>
      </PageHero>

      {/* Why */}
      <section className="py-20 sm:py-24 bg-forest-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.2fr_1fr] gap-14 items-center">
          <Reveal>
            <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">Why it matters</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-cream-50 font-bold leading-tight">
              Protecting the future of <span className="text-gold-foil">watchmaking</span>
            </h2>
            <div className="mt-6 space-y-5 text-lg text-cream-200 leading-relaxed">
              <p>
                RIHOSO is a nonprofit that preserves the history, tradition and art of watchmaking in Rhode Island through
                community outreach and continuing education.
              </p>
              <p>
                Protecting the future of watchmaking, and opening doors for people who want to enter the industry, are
                cornerstones of our foundation. Our after-school program gives high school and college students a real
                pathway to learn about horology, timepieces and the watch business — and the career and scholarship
                opportunities that help grow watchmaking in the United States.
              </p>
            </div>
            <OrnamentDivider className="!justify-start mt-8" />
          </Reveal>
          <Reveal delay={150} className="grid grid-cols-2 gap-4">
            <Framed photo={PHOTOS.workshopVisit} className="row-span-2 h-full min-h-[18rem]" sizes="(min-width: 1024px) 240px, 45vw" />
            <Framed photo={PHOTOS.screwdrivers} className="aspect-square" sizes="(min-width: 1024px) 240px, 45vw" />
            <Framed photo={PHOTOS.watchTray} className="aspect-square" sizes="(min-width: 1024px) 240px, 45vw" />
          </Reveal>
        </div>
      </section>

      {/* Program */}
      <section className="relative py-20 sm:py-24 bg-forest-900 border-y border-gold-400/10 overflow-hidden">
        <div className="absolute inset-0 bg-guilloche opacity-50 pointer-events-none" />
        <div className="pointer-events-none absolute -right-24 top-10 text-gold-400/[0.07]">
          <Gear className="w-80 h-80 animate-rotate-slow" teeth={30} />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">The after-school program</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-cream-50">What students get</h2>
            <OrnamentDivider className="mt-6" />
          </Reveal>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PROGRAM.map((p, i) => (
              <Reveal key={p.title} delay={(i % 4) * 100} className="h-full">
                <div className="card-lux group h-full rounded-xl p-6">
                  <span className="flex items-center justify-center w-12 h-12 rounded-full border border-gold-400/40 text-gold-400 group-hover:bg-gold-400 group-hover:text-forest-950 transition-colors duration-300">
                    <Icon name={p.icon} className="w-6 h-6" />
                  </span>
                  <h3 className="mt-4 font-display text-lg text-cream-50">{p.title}</h3>
                  <p className="mt-2 text-cream-300 leading-relaxed">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Voices */}
      <section className="py-20 sm:py-24 bg-forest-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-[1fr_1.2fr] gap-12 items-center">
          <Reveal>
            <Framed photo={PHOTOS.studentSpeaker} className="aspect-[4/5] max-w-md mx-auto" sizes="(min-width: 768px) 420px, 90vw" />
          </Reveal>
          <Reveal delay={150}>
            <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">Young enthusiasts, real experience</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-cream-50 font-bold leading-tight">
              Learning from the people who do the work
            </h2>
            <p className="mt-6 text-lg text-cream-200 leading-relaxed">
              Students meet certified watchmakers, retailers and collectors at the bench and at society events. They handle
              tools and movements, hear how the industry works from the inside, and get to know mentors who can help them take
              the next step — whether that&apos;s a watchmaking school, a scholarship or a first job in the trade.
            </p>
            <ul className="mt-6 space-y-3 text-cream-200">
              {[
                "For high school and college students",
                "Meetings on campus, plus trips to businesses and museums",
                "Schools and teachers can host a RIHOSO club",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gold-400 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Interest form */}
      <section id="interest" className="relative py-20 sm:py-24 bg-forest-900/60 border-t border-gold-400/10 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
          <Reveal>
            <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">Get involved</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-cream-50 font-bold leading-tight">
              Sign up for the program
            </h2>
            <p className="mt-6 text-lg text-cream-200 leading-relaxed">
              Parents, students 13 and older, and teachers are all welcome to get in touch. Tell us the school and when meetings
              would work, and we&apos;ll follow up by email.
            </p>
            <p className="mt-4 text-cream-300 leading-relaxed">
              Teachers and school staff: we&apos;d love to bring RIHOSO to your campus as an after-school club.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <Framed photo={PHOTOS.microscope} className="aspect-[3/4]" sizes="(min-width: 1024px) 200px, 45vw" />
              <Framed photo={PHOTOS.movementDemo} className="aspect-[3/4]" sizes="(min-width: 1024px) 200px, 45vw" />
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="panel-lux rounded-xl p-6 sm:p-10 relative">
              <StudentInterestForm />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
