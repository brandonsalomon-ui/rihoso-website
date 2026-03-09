export default function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const dimensions = {
    small: { emblem: 36, text: "text-lg", subtitle: "text-[9px]" },
    default: { emblem: 44, text: "text-2xl", subtitle: "text-[10px]" },
    large: { emblem: 72, text: "text-4xl", subtitle: "text-xs" },
  };
  const d = dimensions[size];

  return (
    <div className="flex items-center gap-3">
      <div
        className="relative rounded-full border-2 border-gold-400 flex items-center justify-center flex-shrink-0"
        style={{ width: d.emblem, height: d.emblem }}
      >
        <svg
          viewBox="0 0 40 40"
          className="text-gold-400"
          style={{ width: d.emblem * 0.6, height: d.emblem * 0.6 }}
        >
          <circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="1" />
          <line x1="20" y1="8" x2="20" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="20" y1="20" x2="28" y2="24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <circle cx="20" cy="20" r="1.5" fill="currentColor" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
            <line
              key={angle}
              x1={20 + 12 * Math.cos((angle * Math.PI) / 180)}
              y1={20 + 12 * Math.sin((angle * Math.PI) / 180)}
              x2={20 + 14 * Math.cos((angle * Math.PI) / 180)}
              y2={20 + 14 * Math.sin((angle * Math.PI) / 180)}
              stroke="currentColor"
              strokeWidth={angle % 90 === 0 ? "1.5" : "0.75"}
            />
          ))}
        </svg>
      </div>
      <div className="flex flex-col">
        <span className={`${d.text} font-display font-bold tracking-[0.2em] text-cream-100 leading-none`}>
          RIHOSO
        </span>
        <span className={`${d.subtitle} font-body tracking-[0.15em] text-gold-400 uppercase leading-tight mt-0.5`}>
          Rhode Island Horological Society
        </span>
      </div>
    </div>
  );
}
