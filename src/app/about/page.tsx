import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import Image from "next/image";
import LiveDial from "@/components/LiveDial";
import PhotoGallery from "@/components/PhotoGallery";
import { PHOTOS } from "@/lib/photos";
import { Gear, GuillocheRosette, Icon, OrnamentDivider, type IconName } from "@/components/ornaments";

export const metadata: Metadata = {
  title: "About RIHOSO",
  description: "Learn about the Rhode Island Horological Society — our mission, history, and community.",
};

const ACTIVITIES: { text: string; icon: IconName }[] = [
  { text: "Monthly meetings with show-and-tell sessions", icon: "users" },
  { text: "Educational presentations on watchmaking and clock repair", icon: "mic" },
  { text: "Horological fairs, swap meets, and community gatherings", icon: "handshake" },
  { text: "Resources and mentorship for aspiring watchmakers", icon: "mentor" },
  { text: "Partnerships with watchmaking schools and institutions", icon: "education" },
];

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
      <section className="py-20 sm:py-24 bg-forest-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.2fr_1fr] gap-14 items-center">
          <Reveal>
            <p className="font-display text-2xl sm:text-3xl text-cream-50 leading-snug">
              The Rhode Island Horological Society (RIHOSO) is a community of watch and clock
              enthusiasts, collectors, historians, and craftspeople dedicated to preserving the
              <span className="text-gold-foil"> art, science, and tradition of horology.</span>
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
            RIHOSO exists to foster education, fellowship, and appreciation for the horological
            arts.
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
              photos={[PHOTOS.movementDemo, PHOTOS.membersEvening, PHOTOS.demoConversation, PHOTOS.membersDinner, PHOTOS.presentation, PHOTOS.portrait]}
              layout={["md:row-span-2", "md:col-span-2", "md:row-span-2", "md:col-span-2", "md:col-span-2", "md:col-span-2"]}
            />
          </Reveal>
        </div>
      </section>

      {/* What we do */}
      <section className="py-20 sm:py-24 bg-forest-900/60 border-t border-gold-400/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-cream-50">What We Do</h2>
            <OrnamentDivider className="mt-6" />
          </Reveal>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-6 gap-6">
            {ACTIVITIES.map((a, i) => (
              <Reveal
                key={a.text}
                delay={(i % 3) * 120}
                className={`h-full ${i < 3 ? "lg:col-span-2" : "lg:col-span-3"}`}
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
