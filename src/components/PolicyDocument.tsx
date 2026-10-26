import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import type { ReactNode } from "react";
import PageHero from "@/components/PageHero";
import { POLICIES, POLICY_STATUS, type PolicyKey } from "@/lib/policies";

/** Inline formatting: **bold**, [text](url), and [bracketed placeholders] still to be filled. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|\[([^\]]+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={i++} className="text-cream-50">{m[1]}</strong>);
    else if (m[2]) {
      const href = m[3];
      out.push(
        href.startsWith("/") ? (
          <Link key={i++} href={href} className="text-gold-400 hover:text-gold-300 underline">{m[2]}</Link>
        ) : (
          <a key={i++} href={href} className="text-gold-400 hover:text-gold-300 underline" rel="noopener noreferrer" target="_blank">{m[2]}</a>
        )
      );
    } else if (m[4]) {
      out.push(<mark key={i++} className="bg-gold-400/20 text-gold-200 px-1 rounded">[{m[4]}]</mark>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function render(md: string) {
  const blocks = md.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((b, i) => {
    if (b.startsWith("## ")) {
      const t = b.slice(3);
      return (
        <h2 key={i} id={t.toLowerCase().replace(/[^a-z0-9]+/g, "-")} className="font-display text-2xl text-cream-50 mt-10 mb-3 scroll-mt-28">
          {t}
        </h2>
      );
    }
    const lines = b.split("\n");
    if (lines.every((l) => l.startsWith("- "))) {
      return (
        <ul key={i} className="list-disc pl-6 space-y-2 text-cream-200">
          {lines.map((l, j) => <li key={j}>{inline(l.slice(2))}</li>)}
        </ul>
      );
    }
    return <p key={i} className="text-cream-200 leading-relaxed">{inline(lines.join(" "))}</p>;
  });
}

export default function PolicyDocument({ policy, file }: { policy: PolicyKey; file: string }) {
  const md = fs.readFileSync(path.join(process.cwd(), "src/content/policies", file), "utf8");
  const meta = POLICIES[policy];
  return (
    <>
      <PageHero eyebrow="RIHOSO" title={meta.title} />
      <section className="py-14 bg-forest-800">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {POLICY_STATUS === "draft" && (
            <p className="rounded-lg border border-gold-400/40 bg-gold-400/10 px-4 py-3 text-sm text-gold-200">
              Draft pending legal review — not yet in effect. Highlighted items are still to be confirmed. Version {meta.version}.
            </p>
          )}
          {render(md)}
          <nav className="pt-10 text-sm text-cream-400 flex flex-wrap gap-x-6 gap-y-2 border-t border-forest-600/40">
            {Object.values(POLICIES).map((p) => (
              <Link key={p.href} href={p.href} className="hover:text-gold-300">{p.title}</Link>
            ))}
          </nav>
        </article>
      </section>
    </>
  );
}
