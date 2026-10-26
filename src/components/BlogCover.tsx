import { Gear, GuillocheRosette, WatchDial } from "./ornaments";

export type Variant = "dial" | "pendulum" | "pocket" | "gears";

const BY_SLUG: Record<string, Variant> = {
  "art-of-mechanical-timekeeping": "dial",
  "new-england-clockmaking-heritage": "pendulum",
  "getting-started-with-watch-collecting": "pocket",
  "restoring-antique-clocks": "gears",
};

/** Illustrated cover for a blog post, drawn in the site's gold-on-green engraving style. */
export default function BlogCover({ slug, variant: given, className = "" }: { slug: string; variant?: string; className?: string }) {
  const variant: Variant = (["dial", "pendulum", "pocket", "gears"] as const).find((v) => v === given) ?? BY_SLUG[slug] ?? "dial";
  return (
    <div className={`relative overflow-hidden bg-forest-950 ${className}`} aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(201,168,76,0.18),transparent_60%)]" />
      <div className="absolute inset-0 bg-guilloche opacity-70" />
      <div className="absolute inset-0 flex items-center justify-center">
        <GuillocheRosette className="w-[115%] max-w-none text-gold-400/[0.08] animate-rotate-slow" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center text-gold-300/70 group-hover:text-gold-200/90 transition-colors duration-700">
        {variant === "dial" && <WatchDial className="h-[78%] w-auto transition-transform duration-[1.5s] group-hover:rotate-[8deg]" />}
        {variant === "pocket" && (
          <div className="h-[88%] aspect-[200/240] flex flex-col items-center">
            <svg viewBox="0 0 60 44" className="w-[30%] h-auto -mb-[3%]" fill="none" stroke="currentColor">
              <circle cx="30" cy="16" r="13" strokeWidth="2.4" />
              <rect x="21" y="27" width="18" height="16" rx="3" strokeWidth="1.8" />
              <path d="M24 31h12M24 35h12M24 39h12" strokeWidth="0.9" />
            </svg>
            <div className="w-[88%] aspect-square rounded-full border-[3px] border-current p-[3%]">
              <WatchDial className="w-full h-full" />
            </div>
          </div>
        )}
        {variant === "pendulum" && (
          <svg viewBox="0 0 200 260" className="h-[88%] w-auto" fill="none" stroke="currentColor">
            <path d="M40 250V90a60 60 0 01120 0v160z" strokeWidth="2" />
            <path d="M50 250V92a50 50 0 01100 0v158" strokeWidth="0.8" />
            <circle cx="100" cy="92" r="40" strokeWidth="1.4" />
            {Array.from({ length: 12 }).map((_, i) => {
              const a = ((i * 30 - 90) * Math.PI) / 180;
              return (
                <line
                  key={i}
                  x1={Math.round((100 + 32 * Math.cos(a)) * 10) / 10}
                  y1={Math.round((92 + 32 * Math.sin(a)) * 10) / 10}
                  x2={Math.round((100 + 38 * Math.cos(a)) * 10) / 10}
                  y2={Math.round((92 + 38 * Math.sin(a)) * 10) / 10}
                  strokeWidth={i % 3 === 0 ? 2 : 0.8}
                />
              );
            })}
            <path d="M100 92L84 76M100 92l22-8" strokeWidth="2" strokeLinecap="round" />
            <rect x="62" y="148" width="76" height="92" rx="4" strokeWidth="0.8" />
            <g className="animate-pendulum" style={{ transformOrigin: "100px 140px" }}>
              <line x1="100" y1="140" x2="100" y2="214" strokeWidth="1.4" />
              <circle cx="100" cy="222" r="10" fill="currentColor" fillOpacity="0.35" strokeWidth="1.4" />
            </g>
          </svg>
        )}
        {variant === "gears" && (
          <div className="relative h-[82%] aspect-square">
            <Gear className="absolute left-0 top-[8%] w-[62%] h-[62%] animate-rotate-medium" teeth={28} />
            <Gear className="absolute right-[2%] top-[38%] w-[46%] h-[46%] animate-rotate-slow-reverse" teeth={20} />
            <Gear className="absolute left-[30%] bottom-0 w-[30%] h-[30%] animate-rotate-slow" teeth={12} />
          </div>
        )}
      </div>
    </div>
  );
}
