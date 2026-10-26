import Link from "next/link";
import type { ReactNode } from "react";

/** Inline formatting: **bold**, *italic*, [text](url), and optionally [bracketed placeholders]. */
function inline(text: string, placeholders: boolean): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\)|\[([^\]]+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={i++} className="text-cream-50">{m[1]}</strong>);
    else if (m[2]) out.push(<em key={i++}>{m[2]}</em>);
    else if (m[3]) {
      const href = m[4];
      out.push(
        href.startsWith("/") ? (
          <Link key={i++} href={href} className="text-gold-400 hover:text-gold-300 underline">{m[3]}</Link>
        ) : /^https?:\/\//.test(href) ? (
          <a key={i++} href={href} className="text-gold-400 hover:text-gold-300 underline" rel="noopener noreferrer" target="_blank">{m[3]}</a>
        ) : (
          m[3]
        )
      );
    } else if (m[5]) {
      out.push(placeholders ? <mark key={i++} className="bg-gold-400/20 text-gold-200 px-1 rounded">[{m[5]}]</mark> : `[${m[5]}]`);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * A small, safe Markdown renderer for trusted-but-plain content: ## and ### headings, paragraphs,
 * "- " bullet lists, **bold**, *italic* and links. No raw HTML is ever rendered.
 */
export default function Markdown({
  source,
  placeholders = false,
  paragraphClass = "text-cream-200 leading-relaxed",
  dropCap = false,
}: {
  source: string;
  placeholders?: boolean;
  paragraphClass?: string;
  dropCap?: boolean;
}) {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  let firstParagraph = true;
  return (
    <>
      {blocks.map((b, i) => {
        if (b.startsWith("### ")) {
          return <h3 key={i} className="font-display text-xl text-cream-50 mt-8 mb-2">{inline(b.slice(4), placeholders)}</h3>;
        }
        if (b.startsWith("## ")) {
          const t = b.slice(3);
          return (
            <h2 key={i} id={t.toLowerCase().replace(/[^a-z0-9]+/g, "-")} className="font-display text-2xl text-cream-50 mt-10 mb-3 scroll-mt-28">
              {inline(t, placeholders)}
            </h2>
          );
        }
        const lines = b.split("\n");
        if (lines.every((l) => /^[-*] /.test(l))) {
          return (
            <ul key={i} className="list-disc pl-6 space-y-2 text-cream-200">
              {lines.map((l, j) => <li key={j}>{inline(l.slice(2), placeholders)}</li>)}
            </ul>
          );
        }
        const cap = dropCap && firstParagraph;
        firstParagraph = false;
        return (
          <p
            key={i}
            className={`${paragraphClass} ${cap ? "first-letter:float-left first-letter:font-display first-letter:text-7xl first-letter:leading-[0.85] first-letter:mr-3 first-letter:mt-1 first-letter:text-gold-400" : ""}`}
          >
            {inline(lines.join(" "), placeholders)}
          </p>
        );
      })}
    </>
  );
}
