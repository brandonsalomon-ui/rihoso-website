import type { Metadata } from "next";
import Link from "next/link";
import BlogCover from "@/components/BlogCover";
import { Icon, OrnamentDivider } from "@/components/ornaments";

const articles: Record<string, { title: string; date: string; content: string }> = {
  "art-of-mechanical-timekeeping": {
    title: "The Art of Mechanical Timekeeping",
    date: "2026-02-15",
    content: `Mechanical timekeeping is one of humanity's greatest achievements — a marriage of precision engineering, artistic expression, and scientific understanding that has evolved over centuries.

From the earliest spring-driven clocks of the 15th century to the exquisite tourbillons of today, mechanical timepieces represent far more than a way to tell time. They are miniature universes of interlocking gears, springs, and escapements, each component working in concert to measure the passage of time.

What draws people to mechanical watches and clocks in an age of atomic clocks and smartphones? The answer lies in the tangible connection to craftsmanship. When you hold a mechanical watch, you hold the work of human hands — hours of patient assembly, adjustment, and finishing.

The escapement, the beating heart of any mechanical timepiece, transforms the stored energy of a mainspring into the regulated ticks that mark each second. The balance wheel oscillates back and forth, its rhythm as steady as a heartbeat, governing the march of the hands across the dial.

For members of RIHOSO, the fascination with mechanical timekeeping is both intellectual and emotional. We gather not just to admire these machines, but to understand them — to learn the language of horology and to appreciate the generations of innovation that brought us from sundials to marine chronometers, from tower clocks to wristwatch movements thinner than a coin.`,
  },
  "new-england-clockmaking-heritage": {
    title: "New England's Clockmaking Heritage",
    date: "2026-01-20",
    content: `New England holds a special place in the history of American horology. From the colonial era through the industrial revolution, this region was the beating heart of clockmaking in the United States.

The story begins with early craftsmen like Benjamin Banneker and Eli Terry, whose innovations transformed clockmaking from an exclusive luxury into something accessible to ordinary American households. Terry's development of interchangeable parts for clock movements in the early 1800s was revolutionary — a precursor to the mass manufacturing techniques that would define American industry.

Connecticut's "Clock Valley" became the center of American clock production, with firms like Seth Thomas, Ansonia, and New Haven Clock Company producing millions of timepieces. Rhode Island, too, played its role, with skilled craftsmen and small workshops contributing to the region's horological output.

The legacy of New England clockmaking extends beyond the physical timepieces. It established traditions of precision manufacturing, apprenticeship, and craftsmanship that continue to influence American horology today.

At RIHOSO, we celebrate this heritage through education, preservation, and community. Many of our members are custodians of New England-made clocks and watches, keeping these pieces of American history alive and ticking.`,
  },
  "getting-started-with-watch-collecting": {
    title: "Getting Started with Watch Collecting",
    date: "2025-12-10",
    content: `Watch collecting is a deeply personal pursuit. There is no single right way to build a collection — it should reflect your interests, your curiosity, and your connection to the art of timekeeping.

For beginners, the world of watches can seem overwhelming. Thousands of brands, countless complications, and a vocabulary all its own. But every collector started somewhere, and the best advice is simple: buy what speaks to you.

Start by handling watches whenever possible. Visit local watch shops, attend horological fairs (like those hosted by RIHOSO), and connect with collectors who are happy to share their knowledge and let you examine their pieces.

Learn the basics: understand the difference between manual-wind and automatic movements, know what a complication is, and familiarize yourself with the major watchmaking houses and their histories.

Set a budget and stick to it. Some of the most interesting and historically significant watches are surprisingly affordable. Vintage Soviet watches, mid-century American pieces, and Japanese mechanical watches all offer excellent entry points for new collectors.

Most importantly, join a community. Organizations like RIHOSO provide invaluable opportunities to learn from experienced collectors, discover pieces you might never encounter on your own, and share the joy of horology with like-minded enthusiasts.`,
  },
  "restoring-antique-clocks": {
    title: "Restoring Antique Clocks: A Labor of Love",
    date: "2025-11-05",
    content: `There is something deeply satisfying about bringing an antique clock back to life. A timepiece that has been silent for decades — perhaps centuries — begins to tick again, its pendulum swinging, its hands marking the hours as they were meant to.

Clock restoration is equal parts detective work, engineering, and artistry. It begins with careful examination: understanding the movement, identifying missing or damaged parts, and researching the clock's history and original specifications.

The first rule of restoration is to do no harm. Wherever possible, original parts should be preserved and repaired rather than replaced. The patina of age — the gentle wear on brass, the darkening of steel — tells the story of the clock's life and should be respected.

Cleaning is perhaps the most critical step. Years of dust, dried oil, and oxidation can bring a movement to a standstill. Careful disassembly, ultrasonic cleaning, and re-oiling with appropriate lubricants can work wonders.

Our members at RIHOSO have collectively restored hundreds of clocks, from simple mantel clocks to complex tower clock movements. We share our techniques, our discoveries, and our mistakes — because in restoration, as in horology itself, there is always more to learn.`,
  },
};

export function generateStaticParams() {
  return Object.keys(articles).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const article = articles[params.slug];
  if (!article) return { title: "Article Not Found" };
  return {
    title: article.title,
    description: article.content.slice(0, 160),
  };
}

export default function BlogArticle({ params }: { params: { slug: string } }) {
  const article = articles[params.slug];

  if (!article) {
    return (
      <section className="py-20 bg-forest-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-display text-cream-50 mb-4">Article Not Found</h1>
          <Link href="/blog" className="text-gold-400 hover:text-gold-300 transition-colors">
            &larr; Back to Blog
          </Link>
        </div>
      </section>
    );
  }

  const paragraphs = article.content.split("\n\n");

  return (
    <>
      <section className="relative bg-forest-900 border-b border-gold-400/10">
        <div className="absolute inset-0 opacity-80">
          <BlogCover slug={params.slug} className="h-full w-full" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-forest-900 via-forest-900/75 to-forest-900/40" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:pt-32 sm:pb-20 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-200 text-sm tracking-wide transition-colors"
          >
            <Icon name="arrow" className="w-4 h-4 rotate-180" />
            Back to Blog
          </Link>
          <h1 className="mt-6 text-4xl sm:text-5xl font-display font-bold text-cream-50 leading-tight text-balance">
            {article.title}
          </h1>
          <p className="mt-5 text-xs uppercase tracking-[0.3em] text-gold-400">
            {new Date(article.date + "T12:00:00").toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <OrnamentDivider className="mt-8" />
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-forest-800">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6 text-lg sm:text-xl text-cream-200 leading-relaxed">
            {paragraphs.map((paragraph, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? "first-letter:float-left first-letter:font-display first-letter:text-7xl first-letter:leading-[0.85] first-letter:mr-3 first-letter:mt-1 first-letter:text-gold-400"
                    : ""
                }
              >
                {paragraph}
              </p>
            ))}
          </div>
          <OrnamentDivider className="mt-14" />
          <div className="mt-10 text-center">
            <Link href="/blog" className="text-gold-400 hover:text-gold-200 tracking-wide transition-colors">
              More from the Society
            </Link>
          </div>
        </article>
      </section>
    </>
  );
}
