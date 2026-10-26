import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlogCover from "@/components/BlogCover";
import Markdown from "@/components/Markdown";
import { Icon, OrnamentDivider } from "@/components/ornaments";
import { fmtPostDate, getPost } from "@/lib/blog";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: "Article Not Found" };
  return { title: post.title, description: post.excerpt };
}

export default async function BlogArticle({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();
  const sources = (post.sources ?? []).filter((s) => s && s.title && /^https?:\/\//.test(s.url));

  return (
    <>
      <section className="relative bg-forest-900 border-b border-gold-400/10">
        <div className="absolute inset-0 opacity-80">
          <BlogCover slug={post.slug} variant={post.cover} className="h-full w-full" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-forest-900 via-forest-900/75 to-forest-900/40" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:pt-32 sm:pb-20 text-center">
          <Link href="/blog" className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-200 text-sm tracking-wide transition-colors">
            <Icon name="arrow" className="w-4 h-4 rotate-180" />
            Back to Blog
          </Link>
          <h1 className="mt-6 text-4xl sm:text-5xl font-display font-bold text-cream-50 leading-tight text-balance">{post.title}</h1>
          <p className="mt-5 text-xs uppercase tracking-[0.3em] text-gold-400">
            {fmtPostDate(post.published_at)} · {post.author}
          </p>
          <OrnamentDivider className="mt-8" />
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-forest-800">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <Markdown source={post.body} dropCap paragraphClass="text-lg sm:text-xl text-cream-200 leading-relaxed" />
          </div>
          {sources.length > 0 && (
            <div className="mt-12 border-t border-forest-600/40 pt-6">
              <h2 className="text-gold-400 uppercase tracking-widest text-xs mb-3">Sources and further reading</h2>
              <ol className="list-decimal pl-5 space-y-1 text-sm text-cream-300">
                {sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-gold-300 underline">{s.title}</a>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <OrnamentDivider className="mt-14" />
          <div className="mt-10 text-center">
            <Link href="/blog" className="text-gold-400 hover:text-gold-200 tracking-wide transition-colors">More from the Society</Link>
          </div>
        </article>
      </section>
    </>
  );
}
