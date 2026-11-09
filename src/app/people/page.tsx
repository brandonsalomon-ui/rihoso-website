import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { GuillocheRosette, Icon, OrnamentDivider } from "@/components/ornaments";
import { initials, PEOPLE, type Person } from "@/lib/people";
import { PHOTOS } from "@/lib/photos";

export const metadata: Metadata = {
  title: "Our People",
  description:
    "The watchmakers, horologists, advisors and volunteers behind the Rhode Island Horological Society (RIHOSO).",
};

function Portrait({ person }: { person: Person }) {
  return (
    <div className="relative mx-auto w-36 h-36 sm:w-40 sm:h-40 rounded-full p-[2px] bg-gradient-to-br from-gold-300/90 via-gold-500/40 to-gold-400/70 shadow-[0_20px_40px_-18px_rgba(0,0,0,0.8)]">
      <div className="relative w-full h-full rounded-full overflow-hidden bg-forest-950">
        {person.photo ? (
          <Image src={person.photo} alt={person.name} fill sizes="160px" className="object-cover" />
        ) : (
          <>
            <GuillocheRosette className="absolute inset-0 w-full h-full text-gold-400/[0.12]" />
            <span className="absolute inset-0 flex items-center justify-center font-display text-4xl sm:text-5xl text-gold-foil tracking-wide">
              {initials(person.name)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default function PeoplePage() {
  return (
    <>
      <PageHero
        eyebrow="Who We Are"
        title="Our People"
        subtitle="The watchmakers, horologists, advisors and volunteers who guide the Rhode Island Horological Society."
        image={PHOTOS.membersEvening.src}
      />

      <section className="relative py-20 sm:py-24 bg-forest-800 overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-3xl mx-auto">
            <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">The Society</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-cream-50">
              The people behind <span className="text-gold-foil">RIHOSO</span>
            </h2>
            <p className="mt-6 text-lg text-cream-300 leading-relaxed">
              RIHOSO is led by a small group who share a passion for horology — master watchmakers, experts and
              advisors, and the volunteers who bring our events and education programs to life.
            </p>
            <OrnamentDivider className="mt-6" />
          </Reveal>

          <ul className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PEOPLE.map((p, i) => (
              <Reveal as="li" key={p.name} delay={(i % 4) * 100} className="h-full">
                <div className="card-lux h-full rounded-xl px-6 py-8 text-center">
                  <Portrait person={p} />
                  <h3 className="mt-6 font-display text-xl text-cream-50">{p.name}</h3>
                  <p className="mt-2 text-sm uppercase tracking-[0.18em] text-gold-300 leading-relaxed">{p.title}</p>
                  {p.bio && <p className="mt-4 text-cream-300 leading-relaxed">{p.bio}</p>}
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-forest-900/60 border-t border-gold-400/10">
        <Reveal className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-2xl sm:text-3xl text-cream-50 font-bold">Get involved</h2>
          <p className="mt-4 text-cream-300 text-lg">
            Whether you collect, repair, or are simply curious about how a watch works, there&apos;s a place for you at
            RIHOSO.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/memberships#join" className="btn-gold px-8 py-4 tracking-widest uppercase inline-flex items-center justify-center gap-2">
              Become a member
              <Icon name="arrow" className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 border border-cream-300/30 text-cream-200 tracking-widest uppercase hover:border-gold-400 hover:text-gold-400 transition-colors"
            >
              Contact us
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
