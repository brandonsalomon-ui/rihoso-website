import Link from "next/link";

export type RankingItem = {
  key: string;
  title: string;
  subtitle?: string;
  value: string;
  valueNote?: string;
  href?: string;
};

/** A short ranked list (top five or so) with a title, a one-line explanation and an empty state. */
export default function RankingPanel({
  title,
  explainer,
  items,
  empty,
}: {
  title: string;
  explainer: string;
  items: RankingItem[];
  empty: string;
}) {
  return (
    <section className="panel-lux rounded-xl p-5">
      <h2 className="font-display text-xl text-cream-50">{title}</h2>
      <p className="mt-1 text-sm text-cream-400 leading-snug">{explainer}</p>
      {items.length ? (
        <ol className="mt-4 divide-y divide-forest-600/40">
          {items.map((item, i) => {
            const body = (
              <div className="flex items-baseline gap-3 py-2.5">
                <span className="w-5 shrink-0 font-display text-gold-400 tabular-nums">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-cream-100">{item.title}</span>
                  {item.subtitle && <span className="block truncate text-xs text-cream-400">{item.subtitle}</span>}
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-cream-50 tabular-nums">{item.value}</span>
                  {item.valueNote && <span className="block text-[11px] text-cream-400">{item.valueNote}</span>}
                </span>
              </div>
            );
            return (
              <li key={item.key}>
                {item.href ? (
                  <Link href={item.href} className="block rounded hover:bg-forest-700/40 -mx-2 px-2 transition-colors">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-4 text-sm text-cream-300 italic">{empty}</p>
      )}
    </section>
  );
}
