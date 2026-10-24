"use client";

import { useEffect, useState } from "react";
import type { School } from "@/lib/schools";
import { Icon } from "./ornaments";
import Reveal from "./Reveal";

const W = 975;
const H = 610;

/** Interactive map + cards. Hovering a card lights its pin; clicking a pin jumps to its card. */
export default function SchoolsExplorer({
  schools,
  home,
  mapBase,
}: {
  schools: School[];
  home: readonly [number, number];
  mapBase: React.ReactNode;
}) {
  const [active, setActive] = useState<number | null>(null);
  // Pins get bigger on phones, where the whole map is drawn at roughly a third of its size.
  const [k, setK] = useState(1);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const apply = () => setK(mq.matches ? 1.6 : 1);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  const current = active !== null ? schools[active] : null;

  function jumpTo(i: number) {
    setActive(i);
    document.getElementById(`school-${i + 1}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const pin = (s: School) => s.pinAt ?? s.point;

  return (
    <>
      {/* Map */}
      <Reveal className="relative rounded-xl panel-lux p-3 sm:p-6 overflow-hidden">
        <div className="absolute inset-0 bg-guilloche opacity-60 pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4 px-2 pb-3 sm:pb-4">
          <p className="text-gold-400 text-xs sm:text-sm uppercase tracking-[0.25em]">Program Map</p>
          <p className="flex items-center gap-2 text-cream-300 text-xs sm:text-sm">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-gold-300 shadow-[0_0_10px_rgba(232,201,110,0.8)]" />
            RIHOSO, Rhode Island
          </p>
        </div>

        <div className="relative" style={{ aspectRatio: `${W} / ${H}` }}>
          <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" role="img" aria-label="Map of the United States showing the watchmaking schools listed below">
            {mapBase}

            {/* Routes from Rhode Island */}
            <g fill="none">
              {schools.map((s, i) => {
                const [x, y] = s.point;
                const [hx, hy] = home;
                const cx = (x + hx) / 2;
                const cy = Math.min(y, hy) - 60 - Math.abs(x - hx) * 0.12;
                const on = active === i;
                return (
                  <path
                    key={s.name}
                    d={`M${hx} ${hy} Q${cx} ${cy} ${x} ${y}`}
                    className="route-dash"
                    stroke={on ? "#e8c96e" : "rgba(201,168,76,0.28)"}
                    strokeWidth={on ? 1.6 : 0.9}
                    strokeDasharray="4 6"
                  />
                );
              })}
            </g>

            {/* Leader lines for nudged pins */}
            {schools.map((s) =>
              s.pinAt ? (
                <g key={s.name}>
                  <line x1={s.point[0]} y1={s.point[1]} x2={s.pinAt[0]} y2={s.pinAt[1]} stroke="rgba(232,201,110,0.6)" strokeWidth="0.8" />
                  <circle cx={s.point[0]} cy={s.point[1]} r="2.2" fill="#e8c96e" />
                </g>
              ) : null
            )}

            {/* Home: Rhode Island */}
            <g transform={`translate(${home[0]} ${home[1]}) scale(${k}) translate(${-home[0]} ${-home[1]})`}>
              <circle cx={home[0]} cy={home[1]} r="10" fill="#e8c96e" className="pin-pulse" />
              <circle cx={home[0]} cy={home[1]} r="7" fill="#e8c96e" stroke="#0f1d0f" strokeWidth="1.5" />
              <circle cx={home[0]} cy={home[1]} r="2.2" fill="#0f1d0f" />
            </g>

            {/* School pins */}
            {schools.map((s, i) => {
              const [x, y] = pin(s);
              const on = active === i;
              return (
                <g
                  key={s.name}
                  role="button"
                  tabIndex={0}
                  aria-label={`${i + 1}. ${s.name}, ${s.location}`}
                  className="cursor-pointer focus:outline-none"
                  transform={`translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})`}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  onClick={() => jumpTo(i)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), jumpTo(i))}
                >
                  <circle cx={x} cy={y} r="22" fill="transparent" />
                  {on && <circle cx={x} cy={y} r="10" fill="#c9a84c" className="pin-pulse" />}
                  <circle
                    cx={x}
                    cy={y}
                    r={on ? 15 : 13}
                    fill={on ? "#e8c96e" : "#0f1d0f"}
                    stroke="#e8c96e"
                    strokeWidth="1.5"
                    style={{ transition: "all 0.3s ease" }}
                  />
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="13"
                    fontFamily="'Playfair Display', Georgia, serif"
                    fontWeight="700"
                    fill={on ? "#0f1d0f" : "#e8c96e"}
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover label */}
          {current && active !== null && (
            <div
              className="pointer-events-none absolute z-10 px-4 py-2.5 rounded-md bg-forest-950/95 border border-gold-400/50 shadow-xl whitespace-nowrap"
              style={{
                left: `${(pin(current)[0] / W) * 100}%`,
                top: `${(pin(current)[1] / H) * 100}%`,
                transform: `translate(${pin(current)[0] < 220 ? "-10%" : pin(current)[0] > 760 ? "-90%" : "-50%"}, ${
                  pin(current)[1] < 120 ? "28px" : "calc(-100% - 26px)"
                })`,
              }}
            >
              <p className="font-display text-cream-50 text-sm sm:text-base leading-tight">{current.name}</p>
              <p className="text-gold-400 text-xs sm:text-sm">{current.location}</p>
            </div>
          )}
        </div>
        <p className="relative px-2 pt-3 text-center text-cream-400 text-xs sm:text-sm">
          Tap a numbered pin to jump to that program.
        </p>
      </Reveal>

      {/* Cards */}
      <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6">
        {schools.map((s, i) => {
          const state = s.location.split(",").pop()?.trim();
          return (
            <Reveal key={s.name} delay={(i % 2) * 120} className="h-full">
              <article
                id={`school-${i + 1}`}
                data-active={active === i}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                className="card-lux group h-full rounded-xl p-7 flex flex-col scroll-mt-28 overflow-hidden"
              >
                <span
                  aria-hidden="true"
                  className="absolute -right-2 -bottom-8 font-display text-[7rem] leading-none font-bold text-gold-400/[0.06] group-hover:text-gold-400/[0.12] transition-colors duration-500 select-none"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="relative flex items-center gap-3 mb-5">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full border border-gold-400/60 font-display font-bold text-gold-300 group-hover:bg-gold-400 group-hover:text-forest-950 transition-colors duration-300">
                    {i + 1}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-cream-300 text-sm">
                    <Icon name="pin" className="w-4 h-4 text-gold-400" />
                    {s.location}
                  </span>
                  {state && (
                    <span className="ml-auto text-[11px] tracking-[0.2em] uppercase text-gold-400/80 border border-gold-400/25 rounded-full px-2.5 py-0.5">
                      {state}
                    </span>
                  )}
                </div>
                <h3 className="relative text-2xl font-display text-cream-50 leading-snug group-hover:text-gold-200 transition-colors duration-300">
                  {s.name}
                </h3>
                <p className="relative mt-3">
                  <span className="inline-block text-xs uppercase tracking-[0.18em] text-forest-950 bg-gold-300/90 rounded-sm px-2 py-1">
                    {s.focus}
                  </span>
                </p>
                <p className="relative mt-4 text-cream-300 leading-relaxed flex-1">{s.description}</p>
                <a
                  href={s.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative mt-6 inline-flex items-center gap-2 self-start text-gold-400 hover:text-gold-200 tracking-wide transition-colors"
                >
                  Visit Website
                  <Icon name="external" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </article>
            </Reveal>
          );
        })}
      </div>
    </>
  );
}
