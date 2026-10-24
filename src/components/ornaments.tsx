// Decorative horological SVG artwork shared across the site.
// All pieces are pure SVG and inherit color from `currentColor`.

type SvgProps = { className?: string; style?: React.CSSProperties };

const rad = (deg: number) => (deg * Math.PI) / 180;
const r1 = (n: number) => Math.round(n * 100) / 100;

/** Classic guilloché rosette — overlapping rotated ellipses inside fine rings. */
export function GuillocheRosette({ className, style, petals = 36 }: SvgProps & { petals?: number }) {
  return (
    <svg viewBox="0 0 400 400" className={className} style={style} aria-hidden="true" fill="none" stroke="currentColor">
      {[190, 182, 176].map((r) => (
        <circle key={r} cx="200" cy="200" r={r} strokeWidth={r === 190 ? 1 : 0.4} />
      ))}
      {Array.from({ length: petals }).map((_, i) => (
        <ellipse
          key={i}
          cx="200"
          cy="200"
          rx="168"
          ry="62"
          strokeWidth="0.35"
          transform={`rotate(${(180 / petals) * i} 200 200)`}
        />
      ))}
      {[56, 40, 24].map((r) => (
        <circle key={r} cx="200" cy="200" r={r} strokeWidth="0.5" />
      ))}
    </svg>
  );
}

/** A full watch dial: chapter ring, minute track, applied indices, sub-seconds. Hands at 10:10. */
export function WatchDial({
  className,
  style,
  roman = true,
  hands = true,
}: SvgProps & { roman?: boolean; hands?: boolean }) {
  const numerals = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
  return (
    <svg viewBox="0 0 400 400" className={className} style={style} aria-hidden="true" fill="none" stroke="currentColor">
      <circle cx="200" cy="200" r="196" strokeWidth="2" />
      <circle cx="200" cy="200" r="188" strokeWidth="0.6" />
      <circle cx="200" cy="200" r="170" strokeWidth="0.6" />
      {Array.from({ length: 60 }).map((_, i) => {
        const a = rad(i * 6 - 90);
        const major = i % 5 === 0;
        const inner = major ? 160 : 172;
        return (
          <line
            key={i}
            x1={r1(200 + inner * Math.cos(a))}
            y1={r1(200 + inner * Math.sin(a))}
            x2={r1(200 + 186 * Math.cos(a))}
            y2={r1(200 + 186 * Math.sin(a))}
            strokeWidth={major ? 2.4 : 0.7}
          />
        );
      })}
      {roman &&
        numerals.map((n, i) => {
          const a = rad(i * 30 - 90);
          return (
            <text
              key={n}
              x={r1(200 + 138 * Math.cos(a))}
              y={r1(200 + 138 * Math.sin(a))}
              fill="currentColor"
              stroke="none"
              fontSize="18"
              fontFamily="'Playfair Display', Georgia, serif"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {n}
            </text>
          );
        })}
      {/* Sub-seconds at 6 o'clock */}
      <circle cx="200" cy="268" r="30" strokeWidth="0.6" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = rad(i * 30 - 90);
        return (
          <line
            key={i}
            x1={r1(200 + 24 * Math.cos(a))}
            y1={r1(268 + 24 * Math.sin(a))}
            x2={r1(200 + 29 * Math.cos(a))}
            y2={r1(268 + 29 * Math.sin(a))}
            strokeWidth="0.6"
          />
        );
      })}
      {hands && (
        <g fill="currentColor" stroke="none">
          {/* hour hand → 10 */}
          <path d="M200 200 L196 196 L150 166 L147 170 L194 204 Z" opacity="0.9" />
          {/* minute hand → 2 */}
          <path d="M200 200 L204 196 L292 146 L294 150 L206 204 Z" opacity="0.9" />
          <line x1="200" y1="268" x2="214" y2="252" stroke="currentColor" strokeWidth="1" />
          <circle cx="200" cy="200" r="6" />
          <circle cx="200" cy="268" r="2.5" />
        </g>
      )}
    </svg>
  );
}

function gearPath(teeth: number, outer: number, inner: number, cx = 100, cy = 100) {
  const step = (Math.PI * 2) / teeth;
  let d = "";
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts: [number, number][] = [
      [inner, a],
      [outer, a + step * 0.15],
      [outer, a + step * 0.45],
      [inner, a + step * 0.6],
    ];
    pts.forEach(([r, t], j) => {
      const x = r1(cx + r * Math.cos(t));
      const y = r1(cy + r * Math.sin(t));
      d += `${i === 0 && j === 0 ? "M" : "L"}${x} ${y} `;
    });
  }
  return d + "Z";
}

/** A watch wheel with crossed spokes (four-arm "crossing" like a train wheel). */
export function Gear({ className, style, teeth = 24 }: SvgProps & { teeth?: number }) {
  return (
    <svg viewBox="0 0 200 200" className={className} style={style} aria-hidden="true" fill="none" stroke="currentColor">
      <path d={gearPath(teeth, 96, 86)} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="100" cy="100" r="76" strokeWidth="1" />
      <circle cx="100" cy="100" r="16" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="6" strokeWidth="1.5" />
      {[0, 90, 180, 270].map((deg) => (
        <path
          key={deg}
          d="M92 84 Q100 50 92 26 M108 84 Q100 50 108 26"
          strokeWidth="1.2"
          transform={`rotate(${deg} 100 100)`}
        />
      ))}
    </svg>
  );
}

/** Gold hairline with a central lozenge — used under section titles. */
export function OrnamentDivider({ className }: SvgProps) {
  return (
    <div className={`flex items-center justify-center gap-3 text-gold-400 ${className ?? ""}`} aria-hidden="true">
      <span className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent to-gold-400/80" />
      <svg viewBox="0 0 40 16" className="w-10 h-4" fill="none" stroke="currentColor">
        <path d="M20 1 L27 8 L20 15 L13 8 Z" strokeWidth="1" />
        <circle cx="20" cy="8" r="2" fill="currentColor" stroke="none" />
        <circle cx="5" cy="8" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="35" cy="8" r="1.2" fill="currentColor" stroke="none" />
      </svg>
      <span className="h-px w-16 sm:w-24 bg-gradient-to-l from-transparent to-gold-400/80" />
    </div>
  );
}

/** Small line icons (24×24) in the site's hairline style. */
export function Icon({ name, className }: { name: IconName; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.3,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
  switch (name) {
    case "time": // hourglass
      return (
        <svg {...common}>
          <path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9s10 4 10 9" />
          <path d="M9.5 18.5h5" />
        </svg>
      );
    case "history": // classical column
      return (
        <svg {...common}>
          <path d="M4 7l8-4 8 4H4zM5 21h14M6 18h12M8 9v9M12 9v9M16 9v9M5 7.5h14" />
        </svg>
      );
    case "art": // engraving burin / quill
      return (
        <svg {...common}>
          <path d="M20 4c-6 1-11 6-13 13l-2 3 3-2c7-2 12-7 12-14z" />
          <path d="M7 17l4-4M14 7l3 3" />
        </svg>
      );
    case "science": // balance wheel + hairspring
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 12c0-1 1.5-1.5 2-.5s-.5 3-2.5 3S8.5 12.5 9 10.5s3.5-3.5 6-2.5 3.5 4 2.5 6.5" />
          <path d="M3.5 12h-1M21.5 12h-1M12 3.5v-1" />
        </svg>
      );
    case "education": // open book
      return (
        <svg {...common}>
          <path d="M3 5.5c3-1 6-1 9 1 3-2 6-2 9-1V19c-3-1-6-1-9 1-3-2-6-2-9-1V5.5z" />
          <path d="M12 6.5V20" />
        </svg>
      );
    case "tradition": // laurel
      return (
        <svg {...common}>
          <path d="M12 21c-5-2-8-6-8-12M12 21c5-2 8-6 8-12" />
          <path d="M5 13c-2 0-3-1-3-2 1-.5 2.5 0 3 2zM6.5 17c-2 .5-3.5-.5-3.5-1.5 1-.5 2.5 0 3.5 1.5zM4.5 9C3 8 3 6.5 3.5 6c1 .2 1.5 1.5 1 3zM19 13c2 0 3-1 3-2-1-.5-2.5 0-3 2zM17.5 17c2 .5 3.5-.5 3.5-1.5-1-.5-2.5 0-3.5 1.5zM19.5 9c1.5-1 1.5-2.5 1-3-1 .2-1.5 1.5-1 3z" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0113 0c0 5-6.5 11-6.5 11z" />
          <circle cx="12" cy="10" r="2.3" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
          <path d="M3.5 9.5h17M8 3v4M16 3v4" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "repeat":
      return (
        <svg {...common}>
          <path d="M4 12a8 8 0 0113.7-5.7L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 01-13.7 5.7L4 15.5M4 20v-4.5h4.5" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20c.5-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M16.5 14.5c2.5 0 4.5 1.5 5 4.5" />
        </svg>
      );
    case "mic":
      return (
        <svg {...common}>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21M8.5 21h7" />
        </svg>
      );
    case "tools": // screwdriver + tweezers
      return (
        <svg {...common}>
          <path d="M4 20l7-7M9.5 11.5l3 3M12 9l3-6 1 1-3 6M13.5 14.5l6-3 .5 1-6 3" />
        </svg>
      );
    case "mentor":
      return (
        <svg {...common}>
          <path d="M2.5 9L12 4.5 21.5 9 12 13.5 2.5 9z" />
          <path d="M6.5 11v4.5c1.5 1.5 3.5 2.3 5.5 2.3s4-.8 5.5-2.3V11M21.5 9v5" />
        </svg>
      );
    case "handshake":
      return (
        <svg {...common}>
          <path d="M2.5 11l3.5-4 4 1.5L13 7l4.5 1L21.5 12M2.5 11l2 2M21.5 12l-2 2" />
          <path d="M8.5 13.5l2 2a1.4 1.4 0 002-2l-2.5-2.5M10.5 15.5l1.5 1.5a1.4 1.4 0 002-2M12 17l1 1a1.4 1.4 0 002-2l-3-3M15 16l.5.5a1.4 1.4 0 002-2L13 10" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
          <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...common}>
          <path d="M4 12h15M14 7l5 5-5 5" />
        </svg>
      );
    case "external":
      return (
        <svg {...common}>
          <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
        </svg>
      );
  }
}

export type IconName =
  | "time"
  | "history"
  | "art"
  | "science"
  | "education"
  | "tradition"
  | "pin"
  | "calendar"
  | "clock"
  | "repeat"
  | "users"
  | "mic"
  | "tools"
  | "mentor"
  | "handshake"
  | "mail"
  | "arrow"
  | "external";
