import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { Icon } from "@/components/ornaments";
import { WOLF_CATEGORIES, WOLF_PRODUCTS, wolfPrice, type WolfProduct } from "@/lib/wolf-catalog";

export const metadata: Metadata = {
  title: "The WOLF Collection",
  description:
    "A curated selection of WOLF 1834 watch winders, watch boxes and travel cases, chosen by the Rhode Island Horological Society. Free shipping, direct from WOLF.",
};

function ProductCard({ p }: { p: WolfProduct }) {
  const color = p.colors[0];
  return (
    <Link href={`/wolf/${p.slug}`} className="card-lux group block rounded-xl overflow-hidden h-full">
      <div className="relative aspect-square bg-cream-50">
        <Image
          src={color.images[0]}
          alt={`${p.name}${p.colors.length > 1 ? ` in ${color.name}` : ""}`}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {p.bestSeller && (
          <span className="absolute top-3 left-3 rounded-full bg-forest-900/90 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gold-300">
            Best seller
          </span>
        )}
      </div>
      <div className="p-5">
        <p className="text-gold-400 text-xs uppercase tracking-[0.25em]">{p.collection}</p>
        <h3 className="mt-1 font-display text-lg text-cream-50 leading-snug">{p.name}</h3>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-cream-100 font-semibold">{wolfPrice(p.priceCents)}</span>
          {p.colors.length > 1 && <span className="text-cream-400">{p.colors.length} colors</span>}
        </div>
      </div>
    </Link>
  );
}

export default function WolfCollectionPage() {
  return (
    <>
      <PageHero
        eyebrow="The RIHOSO Shop"
        title="The WOLF Collection"
        subtitle="Winders, watch boxes and travel cases from WOLF, makers of fine watch and jewelry cases since 1834 — chosen by RIHOSO for the way collectors actually live with their watches."
      >
        <div className="flex flex-wrap justify-center gap-3">
          {WOLF_CATEGORIES.map((cat) => (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              className="px-5 py-2.5 border border-cream-300/30 text-cream-200 text-sm tracking-widest uppercase hover:border-gold-400 hover:text-gold-400 transition-colors"
            >
              {cat.title}
            </a>
          ))}
        </div>
      </PageHero>

      <section className="bg-forest-900 border-b border-gold-400/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid sm:grid-cols-3 gap-4 text-sm text-cream-200">
          {[
            ["Free shipping", "Ships directly from WOLF to your door, anywhere in the US."],
            ["Authorized", "Genuine WOLF, offered with Providence Diamond, an authorized WOLF retailer."],
            ["Supports RIHOSO", "Every order helps fund our watchmaking scholarships."],
          ].map(([title, text]) => (
            <div key={title} className="flex gap-3">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold-400" />
              <p>
                <span className="text-cream-50 font-semibold">{title}.</span> {text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {WOLF_CATEGORIES.map((cat, i) => {
        const items = WOLF_PRODUCTS.filter((p) => p.category === cat.id);
        return (
          <section key={cat.id} id={cat.id} className={`py-16 sm:py-20 scroll-mt-24 ${i % 2 ? "bg-forest-900" : "bg-forest-800"}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Reveal>
                <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">WOLF 1834</p>
                <h2 className="mt-2 font-display text-3xl sm:text-4xl text-cream-50 font-bold">{cat.title}</h2>
                <p className="mt-3 text-cream-300 max-w-2xl">{cat.blurb}</p>
              </Reveal>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {items.map((p, j) => (
                  <Reveal key={p.slug} delay={(j % 4) * 80}>
                    <ProductCard p={p} />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      <section className="py-16 bg-forest-800">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-2xl sm:text-3xl text-cream-50 font-bold">Looking for something else from WOLF?</h2>
          <p className="mt-4 text-cream-300">
            We can order any piece from the full WOLF range — other colors, cabinets, safes and jewelry boxes. Tell us what
            you have in mind.
          </p>
          <Link href="/contact" className="btn-gold mt-8 inline-flex items-center gap-2 px-8 py-4 tracking-widest uppercase">
            Ask us
            <Icon name="arrow" className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
