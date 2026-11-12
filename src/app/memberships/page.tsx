import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import PhotoGallery from "@/components/PhotoGallery";
import MembershipSignup from "@/components/MembershipSignup";
import TikTokViewContent from "@/components/TikTokViewContent";
import { MEMBERSHIP_PRICE_CENTS } from "@/lib/membership";
import { PHOTOS, type Photo } from "@/lib/photos";
import { Gear, Icon, OrnamentDivider, type IconName } from "@/components/ornaments";

export const metadata: Metadata = {
  title: "Memberships",
  description:
    "Join the Rhode Island Horological Society — camaraderie, friends who share your passion for watches, exclusive talks from brands and vendors, and gatherings at great locations. $120 a year.",
};

/** Why members join. */
const REASONS: { title: string; text: string; icon: IconName }[] = [
  {
    title: "Camaraderie",
    text: "A welcoming room where no one asks why you care so much about a watch — they want to see it.",
    icon: "users",
  },
  {
    title: "Shared interests",
    text: "Collectors, watchmakers, students and the simply curious, all brought together by a love of horology.",
    icon: "time",
  },
  {
    title: "Lasting friendships",
    text: "Conversations that start at a meeting and carry on over dinner and for years after.",
    icon: "handshake",
  },
  {
    title: "Exclusive talks",
    text: "Members-only presentations from watch brands, vendors, dealers and watchmakers — and the chance to ask them anything.",
    icon: "mic",
  },
  {
    title: "Great locations",
    text: "Evenings at the University Club, Providence's best bars and restaurants, and garages full of collector cars.",
    icon: "pin",
  },
  {
    title: "And more",
    text: "Show-and-tell, member pricing on events and the Watch Exchange, and a society that funds scholarships for future watchmakers.",
    icon: "tradition",
  },
];

/** Photos for the gallery strip. */
const GALLERY: Photo[] = [
  PHOTOS.universityClubRoom,
  PHOTOS.wristStack,
  PHOTOS.garageTalk,
  PHOTOS.demoConversation,
  PHOTOS.trio,
  PHOTOS.providenceBarCrowd,
];
const GALLERY_LAYOUT = ["md:col-span-2 md:row-span-2", "md:row-span-2", "md:col-span-1", "md:row-span-2", "", "md:col-span-2"];

function Framed({ photo, className = "", sizes }: { photo: Photo; className?: string; sizes: string }) {
  return (
    <div
      className={`relative rounded-2xl p-[1px] bg-gradient-to-br from-gold-300/80 via-gold-500/30 to-gold-400/60 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] ${className}`}
    >
      <div className="relative w-full h-full rounded-[15px] overflow-hidden">
        <Image src={photo.src} alt={photo.alt} fill sizes={sizes} className="object-cover" style={{ objectPosition: photo.focus }} />
      </div>
    </div>
  );
}

/** States the real membership price for search engines and AI assistants. */
const MEMBERSHIP_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "RIHOSO Membership",
  description:
    "Annual membership in the Rhode Island Horological Society: invitations to exclusive members-only events, watch parties and horological talks, monthly meetings, the newsletter, show-and-tell, member pricing on events and the Watchmaking Clinic, and a 5% Watch Exchange selling fee.",
  brand: { "@type": "Organization", name: "Rhode Island Horological Society" },
  image: "https://rihoso.com/rihoso-logo.jpeg",
  url: "https://rihoso.com/memberships",
  offers: {
    "@type": "Offer",
    price: (MEMBERSHIP_PRICE_CENTS / 100).toFixed(2),
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: "https://rihoso.com/memberships",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: (MEMBERSHIP_PRICE_CENTS / 100).toFixed(2),
      priceCurrency: "USD",
      referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "ANN" },
    },
  },
};

export default function MembershipsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(MEMBERSHIP_JSON_LD) }}
      />
      <TikTokViewContent contentId="membership" contentName="RIHOSO Membership" value={MEMBERSHIP_PRICE_CENTS / 100} />
      <PageHero
        eyebrow="Join the Society"
        title="Membership"
        subtitle="Become part of a community dedicated to preserving the art and science of horology."
        image={PHOTOS.membersEvening.src}
        imageFocus="50% 50%"
      >
        <a href="#join" className="btn-gold px-8 py-4 tracking-widest uppercase inline-flex items-center justify-center gap-2">
          Become a member
          <Icon name="arrow" className="w-5 h-5" />
        </a>
      </PageHero>

      {/* Why become a member */}
      <section className="py-20 sm:py-24 bg-forest-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.2fr_1fr] gap-14 items-center">
          <Reveal>
            <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">Why become a member</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-cream-50 font-bold leading-tight">
              More than watches. <span className="text-gold-foil">It&apos;s the people.</span>
            </h2>
            <div className="mt-6 space-y-5 text-lg text-cream-200 leading-relaxed">
              <p>
                RIHOSO brings together people who light up when the conversation turns to movements, complications and the
                story behind a reference number. Whether you own one watch or one hundred, you&apos;ll find friends here who
                share the same fascination.
              </p>
              <p>
                Members gather for relaxed evenings at great locations, hear directly from the brands and craftspeople behind
                the watches they love, and pass the passion on — every membership helps fund scholarships for the next
                generation of watchmakers.
              </p>
            </div>
            <OrnamentDivider className="!justify-start mt-8" />
          </Reveal>
          <Reveal delay={150} className="grid grid-cols-2 gap-4">
            <Framed photo={PHOTOS.membersWatches} className="row-span-2 h-full min-h-[18rem]" sizes="(min-width: 1024px) 240px, 45vw" />
            <Framed photo={PHOTOS.membersDinner} className="aspect-square" sizes="(min-width: 1024px) 240px, 45vw" />
            <Framed photo={PHOTOS.presentation} className="aspect-square" sizes="(min-width: 1024px) 240px, 45vw" />
          </Reveal>
        </div>
      </section>

      {/* Reasons */}
      <section className="relative py-20 sm:py-24 bg-forest-900 border-y border-gold-400/10 overflow-hidden">
        <div className="absolute inset-0 bg-guilloche opacity-50 pointer-events-none" />
        <div className="pointer-events-none absolute -right-24 top-10 text-gold-400/[0.07]">
          <Gear className="w-80 h-80 animate-rotate-slow" teeth={30} />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">What you&apos;ll get</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-cream-50">Reasons to join</h2>
            <OrnamentDivider className="mt-6" />
          </Reveal>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {REASONS.map((r, i) => (
              <Reveal key={r.title} delay={i * 80} className="h-full">
                <div className="card-lux group h-full rounded-xl p-6">
                  <span className="flex items-center justify-center w-12 h-12 rounded-full border border-gold-400/40 text-gold-400 group-hover:bg-gold-400 group-hover:text-forest-950 transition-colors duration-300">
                    <Icon name={r.icon} className="w-6 h-6" />
                  </span>
                  <h3 className="mt-4 font-display text-lg text-cream-50">{r.title}</h3>
                  <p className="mt-2 text-cream-300 leading-relaxed">{r.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-20 sm:py-24 bg-forest-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">Life in the Society</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-cream-50">Moments from our gatherings</h2>
            <OrnamentDivider className="mt-6" />
          </Reveal>
          <Reveal delay={120} className="mt-12">
            <PhotoGallery photos={GALLERY} layout={GALLERY_LAYOUT} />
          </Reveal>
        </div>
      </section>

      {/* Plan + sign-up */}
      <section className="py-20 sm:py-24 bg-forest-900 border-t border-gold-400/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <MembershipSignup />

          <div className="mt-12 text-center">
            <p className="text-cream-400">
              Questions about membership?{" "}
              <Link href="/contact" className="text-gold-400 hover:text-gold-300 transition-colors">
                Contact us
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
