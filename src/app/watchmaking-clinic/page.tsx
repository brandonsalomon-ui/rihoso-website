import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import ClinicBookingForm from "@/components/ClinicBookingForm";
import ClinicInquiryForm from "@/components/ClinicInquiryForm";
import TikTokViewContent from "@/components/TikTokViewContent";
import { CLINIC_PRICE } from "@/lib/clinic";
import { PHOTOS } from "@/lib/photos";
import { Gear, Icon, OrnamentDivider, type IconName } from "@/components/ornaments";

export const metadata: Metadata = {
  title: "Watchmaking Clinic",
  description:
    "A hands-on watchmaking clinic for beginners, led by a RIHOSO watchmaker. Take a mechanical movement apart and put it back together — for parties, corporate events, school outings and celebrations, at any location.",
};

/** Clinic pricing, per person. */
const PRICE = {
  standard: CLINIC_PRICE.standardCents / 100,
  member: CLINIC_PRICE.memberCents / 100,
  minimum: CLINIC_PRICE.minimumSeats,
} as const;

const OCCASIONS: { title: string; text: string; icon: IconName }[] = [
  { title: "Parties & celebrations", text: "Birthdays, anniversaries and milestones with a story to tell.", icon: "users" },
  { title: "Corporate events", text: "Team building and client hospitality that people actually remember.", icon: "handshake" },
  { title: "School outings", text: "A hands-on lesson in engineering, history and craftsmanship.", icon: "education" },
  { title: "Special gatherings", text: "Family reunions, clubs, groups of friends — any reason to get together.", icon: "tradition" },
];

const AGENDA: { title: string; text: string }[] = [
  {
    title: "Welcome & a short history of time",
    text: "Meet your watchmaker and take a quick tour from sundials and pendulum clocks to the mechanical wristwatch.",
  },
  {
    title: "Meet the movement",
    text: "Inside a mechanical watch: the mainspring that stores the power, the gear train, the escapement and the balance wheel that keeps the beat.",
  },
  {
    title: "Tools of the trade",
    text: "Screwdrivers, tweezers, loupes and movement holders — and how a watchmaker handles parts smaller than a grain of rice.",
  },
  {
    title: "Take it apart",
    text: "Guided step by step, disassemble a mechanical movement and see how each component fits into the whole.",
  },
  {
    title: "Put it back together",
    text: "Reassemble the movement piece by piece, wind it, and watch it come back to life.",
  },
  {
    title: "Ask the watchmaker",
    text: "Questions about servicing, caring for a watch, collecting, or what it takes to become a watchmaker.",
  },
];

const DETAILS: string[] = [
  "For beginners — no experience needed",
  "Led by one of RIHOSO's watchmakers",
  "We bring the tools and movements",
  "Held at any location: your home, office, school or venue",
  `Group sessions, ${PRICE.minimum}-person minimum`,
];

const GIFTS = ["Holidays", "Birthdays", "Father's Day", "Graduations", "Just because"];

/**
 * Guest quotes, shown in a section on the page once there is at least one.
 * Only add real comments from people who took a clinic, with their permission.
 */
const TESTIMONIALS: { quote: string; name: string }[] = [];

function Framed({ photo, className = "", sizes }: { photo: (typeof PHOTOS)[keyof typeof PHOTOS]; className?: string; sizes: string }) {
  return (
    <div className={`relative rounded-2xl p-[1px] bg-gradient-to-br from-gold-300/80 via-gold-500/30 to-gold-400/60 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] ${className}`}>
      <div className="relative w-full h-full rounded-[15px] overflow-hidden">
        <Image src={photo.src} alt={photo.alt} fill sizes={sizes} className="object-cover" style={{ objectPosition: photo.focus }} />
      </div>
    </div>
  );
}

export default function WatchmakingClinicPage() {
  return (
    <>
      <TikTokViewContent contentId="watchmaking-clinic" contentName="Watchmaking Clinic" value={CLINIC_PRICE.standardCents / 100} />
      <PageHero
        eyebrow="Education"
        title="Watchmaking Clinic"
        subtitle="A hands-on introduction to watchmaking for beginners. Work alongside a RIHOSO watchmaker, learn how a mechanical watch works, and discover what it takes to put one together."
        image={PHOTOS.movementDemo.src}
        imageFocus="50% 45%"
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#book" className="btn-gold px-8 py-4 tracking-widest uppercase inline-flex items-center justify-center gap-2">
            Book your clinic
            <Icon name="arrow" className="w-5 h-5" />
          </a>
          <a
            href="#agenda"
            className="px-8 py-4 border border-cream-300/30 text-cream-200 tracking-widest uppercase hover:border-gold-400 hover:text-gold-400 transition-colors"
          >
            See the agenda
          </a>
        </div>
      </PageHero>

      {/* Intro */}
      <section className="py-20 sm:py-24 bg-forest-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.2fr_1fr] gap-14 items-center">
          <Reveal>
            <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">The experience</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-cream-50 font-bold leading-tight">
              See what&apos;s really <span className="text-gold-foil">ticking</span> inside
            </h2>
            <div className="mt-6 space-y-5 text-lg text-cream-200 leading-relaxed">
              <p>
                Most people wear a watch every day without ever seeing the tiny machine inside it. In a RIHOSO Watchmaking
                Clinic, your group sits down at the bench with one of our watchmakers and takes a mechanical movement apart —
                and puts it back together again.
              </p>
              <p>
                It&apos;s relaxed, social and genuinely hands-on. Nobody needs any experience, just curiosity. Guests leave
                with a new appreciation for the craftsmanship on their wrist, and a great story to tell.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-3 text-gold-300">
              <Icon name="pin" className="w-6 h-6 shrink-0" />
              <p className="text-cream-200">
                <span className="text-gold-300 font-semibold">We come to you.</span> Clinics can be held at any location.
              </p>
            </div>
            <OrnamentDivider className="!justify-start mt-8" />
          </Reveal>
          <Reveal delay={150} className="grid grid-cols-2 gap-4">
            <Framed photo={PHOTOS.microscope} className="row-span-2 h-full min-h-[18rem]" sizes="(min-width: 1024px) 240px, 45vw" />
            <Framed photo={PHOTOS.screwdrivers} className="aspect-square" sizes="(min-width: 1024px) 240px, 45vw" />
            <Framed photo={PHOTOS.watchTray} className="aspect-square" sizes="(min-width: 1024px) 240px, 45vw" />
          </Reveal>
        </div>
      </section>

      {/* Occasions */}
      <section className="relative py-20 sm:py-24 bg-forest-900 border-y border-gold-400/10 overflow-hidden">
        <div className="absolute inset-0 bg-guilloche opacity-50 pointer-events-none" />
        <div className="pointer-events-none absolute -right-24 top-10 text-gold-400/[0.07]">
          <Gear className="w-80 h-80 animate-rotate-slow" teeth={30} />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">Perfect for</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-cream-50">Any occasion worth gathering for</h2>
            <OrnamentDivider className="mt-6" />
          </Reveal>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {OCCASIONS.map((o, i) => (
              <Reveal key={o.title} delay={i * 100} className="h-full">
                <div className="card-lux group h-full rounded-xl p-6">
                  <span className="flex items-center justify-center w-12 h-12 rounded-full border border-gold-400/40 text-gold-400 group-hover:bg-gold-400 group-hover:text-forest-950 transition-colors duration-300">
                    <Icon name={o.icon} className="w-6 h-6" />
                  </span>
                  <h3 className="mt-4 font-display text-lg text-cream-50">{o.title}</h3>
                  <p className="mt-2 text-cream-300 leading-relaxed">{o.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Agenda */}
      <section id="agenda" className="py-20 sm:py-24 bg-forest-800 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.3fr_1fr] gap-14 items-start">
          <div>
            <Reveal>
              <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">Clinic agenda</p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl text-cream-50 font-bold leading-tight">How the clinic runs</h2>
            </Reveal>
            <ol className="mt-10 relative border-l border-gold-400/25 ml-5 space-y-9">
              {AGENDA.map((a, i) => (
                <Reveal as="li" key={a.title} delay={i * 80} className="relative pl-10">
                  <span className="absolute -left-5 top-0 flex items-center justify-center w-10 h-10 rounded-full border border-gold-400/50 bg-forest-900 font-display text-gold-300">
                    {i + 1}
                  </span>
                  <h3 className="font-display text-xl text-cream-50 pt-1.5">{a.title}</h3>
                  <p className="mt-2 text-cream-300 leading-relaxed">{a.text}</p>
                </Reveal>
              ))}
            </ol>
          </div>

          <Reveal delay={150} className="space-y-6 lg:sticky lg:top-28">
            <div className="panel-lux rounded-xl p-8">
              <p className="text-gold-400 text-sm uppercase tracking-[0.2em] mb-4">Clinic details</p>
              <ul className="space-y-3 text-cream-200">
                {DETAILS.map((d) => (
                  <li key={d} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gold-400 shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <Framed photo={PHOTOS.workshopVisit} className="aspect-[4/3]" sizes="(min-width: 1024px) 420px, 90vw" />
          </Reveal>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative py-20 sm:py-24 bg-forest-900 border-y border-gold-400/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-cream-50">Pricing</h2>
            <OrnamentDivider className="mt-6" />
          </Reveal>
          <div className="mt-14 grid md:grid-cols-2 gap-6">
            <Reveal className="h-full">
              <div className="panel-lux h-full rounded-xl p-8 sm:p-10 text-center">
                <p className="text-gold-400 text-sm uppercase tracking-[0.2em]">Clinic</p>
                <p className="mt-4 font-display text-5xl text-gold-foil">
                  ${PRICE.standard}
                  <span className="text-cream-400 text-base font-body ml-2">per person</span>
                </p>
                <p className="mt-4 text-cream-300">{PRICE.minimum}-person minimum (${PRICE.minimum * PRICE.standard})</p>
              </div>
            </Reveal>
            <Reveal delay={120} className="h-full">
              <div className="panel-lux h-full rounded-xl p-8 sm:p-10 text-center border border-gold-400/40">
                <p className="text-gold-400 text-sm uppercase tracking-[0.2em]">RIHOSO members</p>
                <p className="mt-4 font-display text-5xl text-gold-foil">
                  ${PRICE.member}
                  <span className="text-cream-400 text-base font-body ml-2">per person</span>
                </p>
                <p className="mt-4 text-cream-300">For each guest who is a member</p>
                <p className="mt-1 text-cream-300">
                  Not a member yet?{" "}
                  <Link href="/memberships#join" className="text-gold-400 hover:text-gold-300">
                    Join the Society
                  </Link>
                </p>
              </div>
            </Reveal>
          </div>
          <p className="mt-8 text-center text-sm text-cream-400">
            Proceeds support RIHOSO&apos;s education programs and watchmaking scholarships.
          </p>
        </div>
      </section>

      {/* Gift */}
      <section className="py-20 sm:py-24 bg-forest-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-[1fr_1.2fr] gap-12 items-center">
          <Reveal>
            <Framed photo={PHOTOS.demoConversation} className="aspect-[4/5] max-w-md mx-auto" sizes="(min-width: 768px) 420px, 90vw" />
          </Reveal>
          <Reveal delay={150}>
            <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">Give the experience</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-cream-50 font-bold leading-tight">
              A gift they&apos;ll talk about for years
            </h2>
            <p className="mt-6 text-lg text-cream-200 leading-relaxed">
              For the watch lover who has everything — or the curious mind who has never looked inside a watch. A Watchmaking
              Clinic is a memorable gift to share with family, friends or colleagues.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {GIFTS.map((g) => (
                <span key={g} className="rounded-full border border-gold-400/35 px-4 py-1.5 text-sm text-gold-200">
                  {g}
                </span>
              ))}
            </div>
            <a href="#book" className="inline-flex items-center gap-2 mt-8 text-gold-400 hover:text-gold-300 tracking-widest uppercase text-sm">
              Book a clinic as a gift
              <Icon name="arrow" className="w-4 h-4" />
            </a>
          </Reveal>
        </div>
      </section>

      {/* Testimonials */}
      {TESTIMONIALS.length > 0 && (
        <section className="py-20 sm:py-24 bg-forest-900 border-y border-gold-400/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center">
              <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">From our guests</p>
              <OrnamentDivider className="mt-6" />
            </Reveal>
            <div className="mt-12 grid md:grid-cols-2 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <Reveal key={t.name} delay={i * 120} className="h-full">
                  <figure className="panel-lux h-full rounded-xl p-8 sm:p-10">
                    <blockquote className="font-display text-xl sm:text-2xl text-cream-50 leading-relaxed">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-6 text-gold-300 tracking-[0.2em] uppercase text-sm">— {t.name}</figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Booking & payment */}
      <section id="book" className="relative py-20 sm:py-24 bg-forest-900/60 border-t border-gold-400/10 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1fr_1.6fr] gap-12 items-start">
          <Reveal className="lg:sticky lg:top-28">
            <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">Book</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-cream-50 font-bold leading-tight">Book your clinic</h2>
            <p className="mt-6 text-lg text-cream-200 leading-relaxed">
              List your guests, tell us where you&apos;d like to hold it, and pay securely online. We&apos;ll then be in touch
              to set the date and introduce your watchmaker.
            </p>
            <ul className="mt-6 space-y-2 text-cream-300">
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gold-400 shrink-0" />
                ${PRICE.standard} per person, {PRICE.minimum}-person minimum
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gold-400 shrink-0" />
                ${PRICE.member} for each guest who is a RIHOSO member — we confirm it with a code sent to their email
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gold-400 shrink-0" />
                Don&apos;t know every name yet? Leave it as TBD and tell us later
              </li>
            </ul>
            <div className="mt-8 hidden lg:grid grid-cols-2 gap-4">
              <Framed photo={PHOTOS.movementDemo} className="aspect-[3/4]" sizes="(min-width: 1024px) 200px, 45vw" />
              <Framed photo={PHOTOS.gears} className="aspect-[3/4]" sizes="(min-width: 1024px) 200px, 45vw" />
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="panel-lux rounded-xl p-6 sm:p-10 relative">
              <ClinicBookingForm />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Questions first */}
      <section id="inquire" className="py-16 sm:py-20 bg-forest-800 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">Questions first?</p>
            <h2 className="mt-3 font-display text-2xl sm:text-3xl text-cream-50 font-bold">Send us an inquiry</h2>
            <p className="mt-4 text-cream-300">
              Planning a large group, a school program or something unusual? Tell us about it and we&apos;ll help you plan.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-10 panel-lux rounded-xl p-6 sm:p-10 relative">
              <ClinicInquiryForm />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
