import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { Gear, Icon } from "@/components/ornaments";
import { EXCLUDED_REPAIR_BRANDS, REPAIRS_OPEN } from "@/lib/marketplace";
import { PHOTOS, type Photo } from "@/lib/photos";

export const metadata: Metadata = {
  title: "Watch Repair",
  description:
    "Watch repair and servicing by RIHOSO for every brand except Rolex, Tudor and Patek Philippe — free quote, easy UPS shipping and a signature-required return.",
};

const QUOTE_HREF = "/marketplace/repair";

const STEPS = [
  {
    title: "Get Your Free Quote",
    body: "A simple, guided form helps you describe the issue and add a few photos. We review it and come back with a price — by email, phone or text, whichever you prefer.",
  },
  {
    title: "Ship Your Way",
    body: "Once you approve the quote, print a label at home or just bring a QR code to any UPS Store. Pack it yourself or let the pros at UPS handle it for you.",
  },
  {
    title: "The Master Fix",
    body: "Your piece travels via 2-Day Air to our secure workshop for expert care and restoration.",
  },
  {
    title: "Secure Return",
    body: "We ship your piece back in discreet packaging, with a signature required, so it lands safely in your hands.",
  },
];

const SERVICES: { title: string; body: string; photo: Photo }[] = [
  { title: "Battery replacement", body: "A fresh battery, with seals checked so your quartz watch keeps running as it should.", photo: PHOTOS.repairHandsAtWork },
  { title: "Crystals & gaskets", body: "Scratched or cracked crystals replaced, and worn gaskets renewed.", photo: PHOTOS.repairCaseHolder },
  { title: "Full service", body: "Complete overhaul of quartz, mechanical and automatic movements — cleaned, adjusted and regulated.", photo: PHOTOS.repairScrewdriver },
  { title: "Vintage & pocket watches", body: "Careful restoration of older pieces, with original character respected.", photo: PHOTOS.repairPocketMovement },
];

const GALLERY: Photo[] = [PHOTOS.repairLoupe, PHOTOS.repairTools, PHOTOS.repairGears];

function Framed({ photo, className = "", sizes }: { photo: Photo; className?: string; sizes: string }) {
  return (
    <div className={`relative rounded-2xl p-[1px] bg-gradient-to-br from-gold-300/80 via-gold-500/30 to-gold-400/60 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] ${className}`}>
      <div className="relative w-full h-full rounded-[15px] overflow-hidden">
        <Image src={photo.src} alt={photo.alt} fill sizes={sizes} className="object-cover" style={{ objectPosition: photo.focus }} />
      </div>
    </div>
  );
}

export default function RepairsPage() {
  const brands = EXCLUDED_REPAIR_BRANDS.join(", ").replace(/, ([^,]*)$/, " and $1");
  return (
    <>
      <PageHero
        eyebrow="Watch Repair"
        title="Effortless Shipping. Expert Care."
        subtitle={`Repair and servicing for every watch brand except ${brands} — from a fresh battery to a complete restoration.`}
        image={PHOTOS.repairMovement.src}
        imageFocus={PHOTOS.repairMovement.focus}
      >
        {REPAIRS_OPEN && (
          <Link href={QUOTE_HREF} className="btn-gold inline-flex items-center gap-2 px-8 py-3 tracking-widest uppercase">
            Get Your Free Quote
            <Icon name="arrow" className="w-4 h-4" />
          </Link>
        )}
      </PageHero>

      <section className="relative py-20 sm:py-24 bg-forest-800 overflow-hidden">
        <div className="absolute inset-0 bg-guilloche opacity-50 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-center font-display text-3xl sm:text-4xl font-bold text-cream-50">How it works</h2>
          </Reveal>
          <ol className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} as="li" delay={i * 100} className="card-lux rounded-xl p-7 h-full">
                <p className="font-display text-4xl text-gold-foil mb-3">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="font-display text-xl text-cream-50 mb-2">{s.title}</h3>
                <p className="text-sm text-cream-300 leading-relaxed">{s.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20 sm:py-24 bg-forest-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-center font-display text-3xl sm:text-4xl font-bold text-cream-50">What we take care of</h2>
            <p className="mt-4 text-center text-cream-300 text-lg max-w-2xl mx-auto">
              Every brand is welcome except {brands}. Not sure if we can help? Send a quote request anyway — it&apos;s free and
              there&apos;s no obligation.
            </p>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {SERVICES.map((s) => (
              <Reveal key={s.title} className="h-full">
                <div className="panel-lux rounded-xl overflow-hidden h-full">
                  <div className="relative aspect-[16/9]">
                    <Image src={s.photo.src} alt={s.photo.alt} fill sizes="(min-width: 640px) 480px, 92vw" className="object-cover" style={{ objectPosition: s.photo.focus }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-forest-950/70 to-transparent" />
                  </div>
                  <div className="p-7">
                    <h3 className="font-display text-xl text-cream-50 mb-2">{s.title}</h3>
                    <p className="text-sm text-cream-300 leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-cream-400">
            Every repair is quoted in writing first. No work begins until you approve it, and please don&apos;t ship your
            watch until then.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-forest-900 border-t border-gold-400/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">At the bench</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-cream-50">Careful hands, the right tools</h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {GALLERY.map((p, i) => (
              <Reveal key={p.src} delay={i * 120}>
                <Framed photo={p} className="aspect-[4/5]" sizes="(min-width: 640px) 360px, 92vw" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 bg-forest-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="relative overflow-hidden text-center rounded-2xl panel-lux p-10 sm:p-12">
              <div className="pointer-events-none absolute -right-16 -top-16 text-gold-400/10">
                <Gear className="w-56 h-56 animate-rotate-slow" teeth={26} />
              </div>
              <h2 className="relative text-3xl font-display text-cream-50 mb-3">Ready when you are</h2>
              <p className="relative text-cream-300 text-lg mb-8 max-w-lg mx-auto">
                Tell us about your watch, add a few photos, and we&apos;ll get back to you with a price.
              </p>
              {REPAIRS_OPEN ? (
                <Link href={QUOTE_HREF} className="btn-gold relative inline-flex items-center gap-2 px-8 py-3 tracking-widest uppercase">
                  Get Your Free Quote
                  <Icon name="arrow" className="w-4 h-4" />
                </Link>
              ) : (
                <p className="relative text-cream-200">Repair requests open soon.</p>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
