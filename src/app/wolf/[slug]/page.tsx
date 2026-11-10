import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import TikTokViewContent from "@/components/TikTokViewContent";
import WolfBuyBox from "@/components/wolf/WolfBuyBox";
import { getWolfProduct, WOLF_PRODUCTS, wolfPrice } from "@/lib/wolf-catalog";

export function generateStaticParams() {
  return WOLF_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = getWolfProduct(params.slug);
  if (!p) return { title: "WOLF Collection" };
  return {
    title: `${p.name} — WOLF Collection`,
    description: `${p.summary} ${wolfPrice(p.priceCents)}, free shipping from WOLF.`,
    openGraph: { images: [p.colors[0].images[0]] },
  };
}

export default function WolfProductPage({ params }: { params: { slug: string } }) {
  const product = getWolfProduct(params.slug);
  if (!product) notFound();
  const related = WOLF_PRODUCTS.filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, 4);

  return (
    <>
      <TikTokViewContent contentId={product.colors[0].sku} contentName={product.name} value={product.priceCents / 100} />
      <section className="bg-forest-800 pt-10 pb-20 min-h-[70vh]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="mb-8 text-sm text-cream-400">
            <Link href="/wolf" className="hover:text-gold-400">
              The WOLF Collection
            </Link>
            <span className="mx-2">/</span>
            <span className="text-cream-200">{product.name}</span>
          </nav>
          <WolfBuyBox product={product} />
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-forest-900 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl text-cream-50 font-bold">More from the collection</h2>
            <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <Link key={p.slug} href={`/wolf/${p.slug}`} className="card-lux block rounded-xl p-4 text-cream-100 hover:text-gold-300">
                  <p className="text-gold-400 text-[11px] uppercase tracking-[0.25em]">{p.collection}</p>
                  <p className="mt-1 font-display leading-snug">{p.name}</p>
                  <p className="mt-2 text-sm text-cream-300">{wolfPrice(p.priceCents)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
