import Image from "next/image";
import type { Sponsor } from "@/lib/sponsors";

function Plaque({ s, hidden = false }: { s: Sponsor; hidden?: boolean }) {
  return (
    <li
      className="sponsor-plaque group shrink-0 mr-6 w-56 sm:w-64 h-32 sm:h-36 rounded-xl p-[1px] bg-gradient-to-br from-gold-300/70 via-gold-500/30 to-gold-400/60"
      aria-hidden={hidden || undefined}
    >
      <div
        className="relative w-full h-full rounded-[11px] flex items-center justify-center px-6 py-4 overflow-hidden"
        style={{ backgroundColor: s.bg }}
        title={s.name}
      >
        <Image
          src={`/sponsors/${s.logo}`}
          alt={hidden ? "" : s.name}
          width={s.width}
          height={s.height}
          sizes="256px"
          className="max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    </li>
  );
}

/** Infinite, two-row logo marquee. Pauses on hover; becomes a static grid for reduced-motion visitors. */
export default function SponsorCarousel({ sponsors }: { sponsors: Sponsor[] }) {
  const half = Math.ceil(sponsors.length / 2);
  const rows = [sponsors.slice(0, half), sponsors.slice(half)];

  return (
    <div className="sponsor-marquee relative space-y-6" aria-label="Our sponsors">
      {rows.map((row, r) => (
        <div
          key={r}
          className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
        >
          <ul
            className={`sponsor-track flex w-max ${r % 2 ? "sponsor-track-reverse" : ""}`}
            style={{ animationDuration: `${row.length * 6}s` }}
          >
            {row.map((s) => (
              <Plaque key={s.name} s={s} />
            ))}
            {row.map((s) => (
              <Plaque key={`${s.name}-dup`} s={s} hidden />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
