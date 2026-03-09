import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog",
  description: "Articles, stories, and insights from the Rhode Island Horological Society.",
};

const posts = [
  {
    slug: "art-of-mechanical-timekeeping",
    title: "The Art of Mechanical Timekeeping",
    excerpt:
      "An exploration of what makes mechanical watches and clocks enduring marvels of engineering and artistry.",
    date: "2026-02-15",
    author: "RIHOSO",
  },
  {
    slug: "new-england-clockmaking-heritage",
    title: "New England's Clockmaking Heritage",
    excerpt:
      "From the earliest colonial clockmakers to industrial-era factories, New England shaped American horology.",
    date: "2026-01-20",
    author: "RIHOSO",
  },
  {
    slug: "getting-started-with-watch-collecting",
    title: "Getting Started with Watch Collecting",
    excerpt:
      "A beginner's guide to building a meaningful watch collection — what to look for, where to start, and how to learn.",
    date: "2025-12-10",
    author: "RIHOSO",
  },
  {
    slug: "restoring-antique-clocks",
    title: "Restoring Antique Clocks: A Labor of Love",
    excerpt:
      "Members share their experiences bringing centuries-old timepieces back to life, one gear at a time.",
    date: "2025-11-05",
    author: "RIHOSO",
  },
];

export default function BlogPage() {
  return (
    <section className="py-20 bg-forest-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-gold-400 text-sm uppercase tracking-[0.2em] mb-2 text-center">
          From the Society
        </p>
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-cream-50 mb-4 text-center">
          Blog
        </h1>
        <p className="text-center text-cream-300 mb-12 max-w-2xl mx-auto">
          Stories, insights, and knowledge from our community of horological enthusiasts.
        </p>

        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block bg-forest-800/60 border border-forest-600/30 rounded-lg p-6 hover:border-gold-400/30 transition-colors group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="sm:w-32 shrink-0">
                  <p className="text-gold-400 text-sm">
                    {new Date(post.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <h2 className="text-xl font-display text-cream-100 mb-2 group-hover:text-gold-300 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-cream-300">{post.excerpt}</p>
                  <p className="text-xs text-cream-400 mt-2">By {post.author}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
