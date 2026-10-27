import Link from "next/link";
import { daysOnMarketLabel, formatDate, formatPct, formatUsd, pctChange, referenceSlug } from "@/lib/market/format";
import type { MarketListingRow } from "@/lib/market/types";

/** One tracked listing: what it is, where it's listed, its price story and its time on market. */
export default function ListingRow({ listing: l, sourceName }: { listing: MarketListingRow; sourceName: string }) {
  const change = l.price_changes > 0 ? pctChange(l.first_price_cents, l.price_cents) : null;
  const meta = [l.year, l.dial && `${l.dial} dial`, l.case_material, l.case_size_mm && `${Number(l.case_size_mm)} mm`, l.bracelet]
    .filter(Boolean)
    .join(" · ");
  const extras = [l.has_box && "Box", l.has_papers && "Papers"].filter(Boolean).join(" + ");
  const gone = l.status === "gone";

  return (
    <li className="card-lux rounded-lg px-4 py-4 sm:px-5 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.22em] text-gold-400/90">
          {l.brand}
          {l.certified && <span className="ml-2 text-cream-400 normal-case tracking-normal">· Certified pre-owned</span>}
        </p>
        <h3 className="mt-0.5 font-display text-lg text-cream-50 leading-snug">
          {l.model ?? "Watch"}{" "}
          {l.reference && l.reference_key ? (
            <Link
              href={`/market/${referenceSlug(l.brand, l.reference_key)}`}
              className="text-gold-300 hover:text-gold-200 underline decoration-gold-400/30 underline-offset-4"
            >
              {l.reference}
            </Link>
          ) : (
            l.reference
          )}
        </h3>
        {meta && <p className="mt-1 text-sm text-cream-300 truncate">{meta}</p>}
        <p className="mt-2 text-xs text-cream-400">
          {sourceName}
          {extras && <> · {extras}</>}
          {l.url && (
            <>
              {" · "}
              <a href={l.url} target="_blank" rel="nofollow noopener noreferrer" className="text-gold-400 hover:text-gold-300">
                View listing ↗
              </a>
            </>
          )}
        </p>
      </div>

      <div className="text-right whitespace-nowrap">
        <p className="font-display text-xl text-cream-50 tabular-nums">{formatUsd(l.price_cents)}</p>
        {change != null && (
          <p className={`text-xs tabular-nums ${change < 0 ? "text-gold-300" : "text-cream-300"}`}>
            {formatPct(change)} from {formatUsd(l.first_price_cents, { compact: true })}
          </p>
        )}
        <p className="mt-2 text-sm text-cream-200 tabular-nums">
          {gone ? (
            <>
              {l.outcome === "sold" ? "Sold" : "Left"} after{" "}
              <span className="text-cream-50">{daysOnMarketLabel(l)}</span> days
            </>
          ) : (
            <>
              <span className="text-cream-50">{daysOnMarketLabel(l)}</span> days on market
            </>
          )}
        </p>
        <p className="text-[11px] text-cream-400">
          {gone ? `on ${formatDate(l.gone_at)}` : l.seen_at_launch ? `tracked since ${formatDate(l.first_seen_at)}` : `listed ${formatDate(l.first_seen_at)}`}
        </p>
      </div>
    </li>
  );
}
