import Image from "next/image";
import Link from "next/link";
import Markdown from "@/components/Markdown";
import { OrnamentDivider } from "@/components/ornaments";
import { newsletterPhotoUrl, type Newsletter } from "@/lib/newsletter";
import { GROUP_LABEL, SECTIONS, sectionDef, type NewsletterSection } from "@/lib/newsletter-sections";

function Photos({ section }: { section: NewsletterSection }) {
  if (!section.photos.length) return null;
  const two = section.photos.length > 1;
  return (
    <div className={`my-6 grid gap-4 ${two ? "sm:grid-cols-2" : ""}`}>
      {section.photos.map((p) => (
        <figure key={p.path} className="overflow-hidden rounded-lg border border-gold-400/15 bg-forest-900">
          <div className={`relative ${two ? "aspect-[4/3]" : "aspect-[16/9]"}`}>
            <Image src={newsletterPhotoUrl(p.path)} alt={p.caption || section.title} fill sizes="(min-width: 768px) 720px, 100vw" className="object-cover" />
          </div>
          {(p.caption || p.credit) && (
            <figcaption className="px-4 py-2 text-xs text-cream-300">
              {p.caption}
              {p.credit && <span className="text-cream-400">{p.caption ? " · " : ""}Photo: {p.credit}</span>}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

function Sources({ section }: { section: NewsletterSection }) {
  const list = section.sources.filter((s) => /^https:\/\//.test(s.url));
  if (!list.length) return null;
  return (
    <p className="mt-4 text-xs text-cream-400">
      Sources:{" "}
      {list.map((s, i) => (
        <span key={s.url}>
          {i > 0 && " · "}
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-gold-300">{s.title}</a>
        </span>
      ))}
    </p>
  );
}

/** Table of contents grouped like the email. With `teaser`, shows each section's blurb instead of linking. */
export function IssueContents({ issue, teaser = false }: { issue: Newsletter; teaser?: boolean }) {
  const groups = Array.from(new Set(SECTIONS.map((s) => s.group)));
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {groups.map((g) => {
        const items = issue.sections.filter((s) => sectionDef(s.key)?.group === g && (s.title || s.body));
        if (!items.length) return null;
        return (
          <div key={g}>
            <h3 className="text-gold-400 uppercase tracking-[0.25em] text-xs mb-3">{GROUP_LABEL[g]}</h3>
            <ul className="space-y-3">
              {items.map((s) => (
                <li key={s.key}>
                  <span className="block text-[11px] uppercase tracking-widest text-cream-400">{sectionDef(s.key)?.label}</span>
                  {teaser ? (
                    <>
                      <span className="block font-display text-lg text-cream-50">{s.title}</span>
                      {s.blurb && <span className="block text-sm text-cream-300 leading-relaxed">{s.blurb.replace(/\[([^\]]+)\](?!\()/g, "$1")}</span>}
                    </>
                  ) : (
                    <a href={`#${s.key}`} className="font-display text-lg text-cream-50 hover:text-gold-300 transition-colors">{s.title || sectionDef(s.key)?.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/** The full issue, as members read it. `showPlaceholders` highlights [placeholders] for Brandon's preview. */
export default function NewsletterIssue({ issue, showPlaceholders = false }: { issue: Newsletter; showPlaceholders?: boolean }) {
  return (
    <section className="py-14 sm:py-20 bg-forest-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {issue.intro && (
          <div className="space-y-5">
            <Markdown source={issue.intro} placeholders={showPlaceholders} paragraphClass="text-lg sm:text-xl text-cream-200 leading-relaxed" dropCap />
          </div>
        )}
        <div className="mt-12 rounded-xl border border-gold-400/15 bg-forest-900/50 p-6 sm:p-8">
          <h2 className="font-display text-2xl text-cream-50 mb-6">In this issue</h2>
          <IssueContents issue={issue} />
        </div>

        {issue.sections.map((s) => {
          const def = sectionDef(s.key)!;
          if (!s.body && !s.title) return null;
          const editorial = def.group === "editorial";
          return (
            <article key={s.key} id={s.key} className={`scroll-mt-28 mt-16 ${editorial ? "rounded-xl border border-gold-400/25 bg-forest-900/60 p-6 sm:p-10" : ""}`}>
              <p className="text-gold-400 uppercase tracking-[0.25em] text-xs">{def.label}</p>
              <h2 className="mt-2 font-display text-3xl text-cream-50 leading-tight">{s.title}</h2>
              <Photos section={s} />
              <div className="mt-5 space-y-5">
                <Markdown source={s.body} placeholders={showPlaceholders} paragraphClass="text-lg text-cream-200 leading-relaxed" />
              </div>
              <Sources section={s} />
            </article>
          );
        })}

        <OrnamentDivider className="mt-16" />
        <p className="mt-8 text-center text-sm text-cream-300">
          Know someone who loves watches? <Link href="/memberships#join" className="text-gold-400 underline hover:text-gold-300">A RIHOSO membership</Link> makes a great gift.
        </p>
        <p className="mt-3 text-center">
          <Link href="/newsletter" className="text-gold-400 hover:text-gold-200 tracking-wide">All issues</Link>
        </p>
      </div>
    </section>
  );
}
