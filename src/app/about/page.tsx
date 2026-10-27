import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import Image from "next/image";
import LiveDial from "@/components/LiveDial";
import PhotoGallery from "@/components/PhotoGallery";
import { PHOTOS, type Photo } from "@/lib/photos";
import { Gear, GuillocheRosette, Icon, OrnamentDivider, type IconName } from "@/components/ornaments";

export const metadata: Metadata = {
  title: "About RIHOSO",
  description: "The Rhode Island Horological Society is a nonprofit dedicated to horology and watchmaking education — vintage watch shows, talks, mentorship and scholarships.",
};

const ACTIVITIES: { text: string; icon: IconName }[] = [
  { text: "Memberships help fund scholarships and education for young watchmakers", icon: "education" },
  { text: "Events bring watch enthusiasts together for learning and networking", icon: "users" },
  { text: "Vintage watch shows, horological talks and show-and-tell", icon: "mic" },
  { text: "Mentorship and an after-school program for aspiring watchmakers", icon: "mentor" },
  { text: "Community and local businesses working together to preserve horology", icon: "handshake" },
  { text: "Lasting friendships and long-term relationships", icon: "time" },
];

function FramedPhoto({ photo, className = "" }: { photo: Photo; className?: string }) {
  return (
    <div className={`relative rounded-2xl p-[1px] bg-gradient-to-br from-gold-300/80 via-gold-500/30 to-gold-400/60 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] ${className}`}>
      <div className="relative w-full h-full rounded-[15px] overflow-hidden">
        <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 768px) 520px, 92vw" className="object-cover" style={{ objectPosition: photo.focus }} />
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Who We Are"
        title="About RIHOSO"
        subtitle="A community of watch and clock enthusiasts, collectors, historians, and craftspeople."
        image={PHOTOS.membersEvening.src}
      />

      {/* Intro + live dial */}
      <section className="py-20 sm:py-24 bg-forest-800 overflow-x-clip">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.2fr_1fr] gap-14 items-center">
          <Reveal>
            <p className="font-display text-2xl sm:text-3xl text-cream-50 leading-snug">
              The Rhode Island Horological Society (RIHOSO) is a community of watch and clock
              enthusiasts, collectors, historians, and craftspeople dedicated to preserving the
              <span className="text-gold-foil"> art, science, and tradition of horology.</span>
            </p>
            <p className="mt-6 text-lg text-cream-300 leading-relaxed">
              We&apos;re a nonprofit dedicated to horology and watchmaking education, and a local hub for watch
              enthusiasts and retailers in Rhode Island. Our aim is to preserve watchmaking, open up opportunities in the
              industry, and support young enthusiasts through scholarships and mentor programs.
            </p>
            <OrnamentDivider className="!justify-start mt-8" />
          </Reveal>
          <Reveal delay={150} className="flex justify-center">
            <div className="relative w-full max-w-sm">
              <div className="absolute -inset-10 text-gold-400/10 pointer-events-none">
                <GuillocheRosette className="w-full h-full animate-rotate-slow" />
              </div>
              <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-gold-300/80 via-gold-500/30 to-gold-400/60 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]">
                <div className="relative aspect-[4/5] rounded-[15px] overflow-hidden">
                  <Image
                    src={PHOTOS.microscope.src}
                    alt={PHOTOS.microscope.alt}
                    fill
                    sizes="(min-width: 1024px) 384px, 90vw"
                    className="object-cover"
                    style={{ objectPosition: PHOTOS.microscope.focus }}
                  />
                </div>
              </div>
              <div className="absolute -left-8 -bottom-8 rounded-full p-2 bg-forest-950 border border-gold-400/40 shadow-[0_0_40px_-8px_rgba(201,168,76,0.5)]">
                <LiveDial className="w-28 h-28 sm:w-32 sm:h-32 text-gold-300" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Mission */}
      <section className="relative py-20 sm:py-24 bg-forest-900 border-y border-gold-400/10 overflow-hidden">
        <div className="absolute inset-0 bg-guilloche opacity-60 pointer-events-none" />
        <div className="pointer-events-none absolute -left-20 top-1/2 -translate-y-1/2 text-gold-400/[0.07]">
          <Gear className="w-80 h-80 animate-rotate-slow" teeth={30} />
        </div>
        <Reveal className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">Our Mission</p>
          <span aria-hidden="true" className="block font-display text-8xl leading-none text-gold-400/30 mt-4 -mb-8">
            &ldquo;
          </span>
          <blockquote className="font-display italic text-2xl sm:text-3xl text-cream-100 leading-relaxed">
            Preserving the history, culture and traditions of watchmaking through local community
            outreach, support and continued education.
          </blockquote>
          <p className="mt-8 text-lg text-cream-300 leading-relaxed">
            We bring together people who share a passion for timepieces — from antique pocket
            watches and grandfather clocks to modern mechanical wristwatches and everything in
            between.
          </p>
        </Reveal>
      </section>

      {/* History */}
      <section className="py-20 sm:py-24 bg-forest-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-[auto_1fr] gap-10 md:gap-16 items-start">
          <Reveal className="md:sticky md:top-32">
            <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">Our History</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl text-cream-50 font-bold">
              Rooted in
              <br />
              <span className="text-gold-foil">New England</span>
            </h2>
          </Reveal>
          <div className="space-y-6 text-lg text-cream-200 leading-relaxed border-l border-gold-400/25 pl-8">
            <Reveal>
              <p>
                Founded in Rhode Island, RIHOSO carries forward a long tradition of horological
                interest in New England. The region has deep ties to American watchmaking and
                clockmaking, with a rich history of skilled artisans and innovative manufacturers.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <p>
                Our society brings collectors and makers together to share knowledge, display
                remarkable timepieces, and ensure that the skills and stories of horology are
                passed to future generations.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Past & future */}
      <section className="py-20 sm:py-24 bg-forest-900/60 border-t border-gold-400/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <Reveal>
              <FramedPhoto photo={PHOTOS.garageTalk} className="aspect-[16/10]" />
            </Reveal>
            <Reveal delay={120}>
              <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">Vintage shows &amp; talks</p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl text-cream-50 font-bold leading-tight">
                Preserving the past with the <span className="text-gold-foil">future in mind</span>
              </h2>
              <p className="mt-6 text-lg text-cream-200 leading-relaxed">
                RIHOSO celebrates the past with vintage watch shows and horological talks throughout the year that highlight
                the rich history of watchmaking. These gatherings encourage and inspire young watch lovers, and give them an
                outlet for learning while preserving this important vocational skill.
              </p>
            </Reveal>
          </div>
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <Reveal className="md:order-2">
              <FramedPhoto photo={PHOTOS.trio} className="aspect-[6/5]" />
            </Reveal>
            <Reveal delay={120} className="md:order-1">
              <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">RIHOSO events</p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl text-cream-50 font-bold leading-tight">
                Safeguarding the future of horology
              </h2>
              <p className="mt-6 text-lg text-cream-200 leading-relaxed">
                Through scholarships, mentorship and a full calendar of gatherings, RIHOSO invests in the next generation.
                Our events bring together prominent figures, watchmakers, retailers and experts from across the industry —
                with good food and drink, and a warm, lively atmosphere.
              </p>
              <Link href="/events" className="mt-6 inline-flex items-center gap-2 text-gold-400 tracking-wide hover:text-gold-300 transition-colors">
                See upcoming events
                <Icon name="arrow" className="w-4 h-4" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Students */}
      <section className="relative py-16 sm:py-20 bg-forest-900 border-t border-gold-400/10 overflow-hidden">
        <div className="absolute inset-0 bg-guilloche opacity-50 pointer-events-none" />
        <Reveal className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid sm:grid-cols-[auto_1fr] gap-8 items-center">
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 mx-auto rounded-full p-[1px] bg-gradient-to-br from-gold-300/80 via-gold-500/30 to-gold-400/60">
            <div className="relative w-full h-full rounded-full overflow-hidden">
              <Image src={PHOTOS.workshopVisit.src} alt={PHOTOS.workshopVisit.alt} fill sizes="176px" className="object-cover" style={{ objectPosition: "60% 60%" }} />
            </div>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">RIHOSO for Schools</p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl text-cream-50">An after-school pathway into watchmaking</h2>
            <p className="mt-3 text-cream-300 text-lg leading-relaxed">
              Mentors, hands-on introductions to watchmaking, industry events, trips and scholarship guidance for high school
              and college students.
            </p>
            <Link href="/students" className="btn-gold mt-6 inline-flex items-center gap-2 px-7 py-3 tracking-widest uppercase text-sm">
              Students &amp; Schools
              <Icon name="arrow" className="w-4 h-4" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Photos */}
      <section className="py-20 sm:py-24 bg-forest-800 border-t border-gold-400/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">Life at RIHOSO</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-cream-50">Moments from the Society</h2>
            <OrnamentDivider className="mt-6" />
          </Reveal>
          <Reveal>
            <PhotoGallery
              photos={[
                PHOTOS.movementDemo,
                PHOTOS.membersEvening,
                PHOTOS.demoConversation,
                PHOTOS.membersDinner,
                PHOTOS.patio,
                PHOTOS.watchTray,
                PHOTOS.presentation,
                PHOTOS.eventTable,
                PHOTOS.studentSpeaker,
                PHOTOS.portrait,
              ]}
              layout={[
                "md:row-span-2",
                "md:col-span-2",
                "md:row-span-2",
                "md:col-span-2",
                "md:col-span-2",
                "md:row-span-2",
                "md:row-span-2",
                "md:col-span-2",
                "md:row-span-2",
                "md:col-span-3 md:row-span-2",
              ]}
            />
          </Reveal>
        </div>
      </section>

      {/* What we do */}
      <section className="py-20 sm:py-24 bg-forest-900/60 border-t border-gold-400/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-cream-50">Benefits &amp; What We Do</h2>
            <OrnamentDivider className="mt-6" />
          </Reveal>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-6 gap-6">
            {ACTIVITIES.map((a, i) => (
              <Reveal
                key={a.text}
                delay={(i % 3) * 120}
                className="h-full lg:col-span-2"
              >
                <div className="card-lux group h-full rounded-xl p-7 flex items-start gap-5">
                  <span className="shrink-0 flex items-center justify-center w-14 h-14 rounded-full border border-gold-400/40 text-gold-400 group-hover:bg-gold-400 group-hover:text-forest-950 transition-colors duration-300">
                    <Icon name={a.icon} className="w-7 h-7" />
                  </span>
                  <p className="text-lg text-cream-200 leading-snug pt-1">{a.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-14 text-center">
            <Link href="/memberships#join" className="btn-gold inline-flex items-center gap-3 px-9 py-4 tracking-widest uppercase">
              Become a Member
              <Icon name="arrow" className="w-5 h-5" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
