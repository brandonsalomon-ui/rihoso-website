import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import Markdown from "@/components/Markdown";
import PageHero from "@/components/PageHero";
import { POLICIES, POLICY_STATUS, type PolicyKey } from "@/lib/policies";

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
          <Markdown source={md} placeholders />
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
