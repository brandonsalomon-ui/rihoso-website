import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import BlogCover from "@/components/BlogCover";
import { Icon } from "@/components/ornaments";
import { getPublishedPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Articles, stories, and insights from the Rhode Island Horological Society.",
};

export const revalidate = 300;

export default async function BlogPage() {
  const posts = await getPublishedPosts();
  const [featured, ...rest] = posts;
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric" });

  return (
    <>
      <PageHero
        eyebrow="From the Society"
        title="Blog"
        subtitle="Stories, insights, and knowledge from our community of horological enthusiasts."
      />

      <section className="py-20 sm:py-24 bg-forest-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {!featured && <p className="text-center text-cream-300">New articles are on their way.</p>}
          {/* Featured */}
          {featured && (
          <Reveal>
            <Link
              href={`/blog/${featured.slug}`}
              className="card-lux group grid md:grid-cols-2 rounded-2xl overflow-hidden"
            >
              <BlogCover slug={featured.slug} variant={featured.cover} className="aspect-[16/10] md:aspect-auto md:min-h-[340px]" />
              <div className="p-8 sm:p-10 flex flex-col justify-center">
                <p className="text-xs uppercase tracking-[0.3em] text-gold-400">Latest · {fmt(featured.published_at)}</p>
                <h2 className="mt-4 font-display text-3xl sm:text-4xl text-cream-50 leading-tight group-hover:text-gold-200 transition-colors">
                  {featured.title}
                </h2>
                <p className="mt-4 text-lg text-cream-300 leading-relaxed">{featured.excerpt}</p>
                <span className="mt-8 inline-flex items-center gap-2 text-gold-400 tracking-wide">
                  Read article
                  <Icon name="arrow" className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </Reveal>
          )}

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {rest.map((post, i) => (
              <Reveal key={post.slug} delay={i * 120} className="h-full">
                <Link
                  href={`/blog/${post.slug}`}
                  className="card-lux group flex flex-col h-full rounded-xl overflow-hidden"
                >
                  <BlogCover slug={post.slug} variant={post.cover} className="aspect-[16/10]" />
                  <div className="p-6 flex flex-col flex-1">
                    <p className="text-xs uppercase tracking-[0.25em] text-gold-400">{fmt(post.published_at)}</p>
                    <h2 className="mt-3 text-xl font-display text-cream-50 leading-snug group-hover:text-gold-200 transition-colors">
                      {post.title}
                    </h2>
                    <p className="mt-3 text-cream-300 leading-relaxed flex-1">{post.excerpt}</p>
                    <p className="mt-5 text-sm text-cream-400">By {post.author}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
