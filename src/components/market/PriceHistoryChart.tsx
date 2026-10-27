"use client";

import { useMemo, useRef, useState } from "react";

type Point = { day: string; median_cents: number | null; active_count: number };

const W = 720;
const H = 260;
const PAD = { top: 16, right: 16, bottom: 28, left: 56 };

function niceTicks(min: number, max: number, count = 4) {
  if (min === max) {
    const pad = Math.max(1000, min * 0.05);
    min -= pad;
    max += pad;
  }
  const span = max - min;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) ?? 10 * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(v);
  return { lo, hi, ticks };
}

const usd = (dollars: number) =>
  dollars >= 1000 ? `$${(dollars / 1000).toFixed(dollars % 1000 === 0 ? 0 : 1)}K` : `$${Math.round(dollars)}`;
const fullUsd = (dollars: number) => dollars.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const shortDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** Median asking price per day, one gold line, crosshair + tooltip on hover, with a table fallback. */
export default function PriceHistoryChart({ points, title }: { points: Point[]; title: string }) {
  const data = useMemo(() => points.filter((p) => p.median_cents != null), [points]);
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (data.length < 2) {
    return (
      <p className="text-sm text-cream-300 italic">
        The price line appears once this reference has been tracked for a few days.
      </p>
    );
  }

  const values = data.map((p) => (p.median_cents as number) / 100);
  const { lo, hi, ticks } = niceTicks(Math.min(...values), Math.max(...values));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - ((v - lo) / (hi - lo || 1)) * innerH;
  const path = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${path} L${x(data.length - 1).toFixed(1)},${PAD.top + innerH} L${x(0).toFixed(1)},${PAD.top + innerH} Z`;
  const last = data.length - 1;
  const labelIdx = Array.from(new Set([0, Math.floor(last / 2), last]));

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.left) / innerW) * (data.length - 1));
    setHover(Math.max(0, Math.min(last, i)));
  }

  const h = hover ?? null;

  return (
    <figure>
      <figcaption className="sr-only">{title}</figcaption>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto touch-none"
          role="img"
          aria-label={`${title}: from ${fullUsd(values[0])} on ${shortDate(data[0].day)} to ${fullUsd(values[last])} on ${shortDate(data[last].day)}`}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="rgba(224,212,190,0.10)" strokeWidth={1} />
              <text x={PAD.left - 10} y={y(t)} dy="0.32em" textAnchor="end" fontSize={12} fill="#cdbf9f">
                {usd(t)}
              </text>
            </g>
          ))}
          {labelIdx.map((i) => (
            <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"} fontSize={12} fill="#cdbf9f">
              {shortDate(data[i].day)}
            </text>
          ))}
          <path d={area} fill="#c9a84c" opacity={0.1} />
          <path d={path} fill="none" stroke="#c9a84c" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={x(last)} cy={y(values[last])} r={4} fill="#c9a84c" stroke="#0f1d0f" strokeWidth={2} />
          <text x={x(last) - 8} y={y(values[last]) - 12} textAnchor="end" fontSize={13} fill="#f5f0e8">
            {fullUsd(values[last])}
          </text>
          {h !== null && (
            <g>
              <line x1={x(h)} x2={x(h)} y1={PAD.top} y2={PAD.top + innerH} stroke="rgba(245,240,232,0.35)" strokeWidth={1} />
              <circle cx={x(h)} cy={y(values[h])} r={5} fill="#c9a84c" stroke="#0f1d0f" strokeWidth={2} />
            </g>
          )}
        </svg>
        {h !== null && (
          <div
            className="pointer-events-none absolute top-2 rounded-md border border-gold-400/30 bg-forest-900/95 px-3 py-2 text-xs shadow-lg"
            style={{ left: `${(x(h) / W) * 100}%`, transform: `translateX(${h > last / 2 ? "-105%" : "5%"})` }}
          >
            <p className="text-cream-300">{shortDate(data[h].day)}</p>
            <p className="text-cream-50 text-sm tabular-nums">{fullUsd(values[h])} median ask</p>
            <p className="text-cream-400 tabular-nums">{data[h].active_count} listed</p>
          </div>
        )}
      </div>
      <details className="mt-3 text-sm text-cream-300">
        <summary className="cursor-pointer text-gold-400 hover:text-gold-300">Show as a table</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <thead className="text-cream-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="py-1 font-normal">Day</th>
              <th className="py-1 font-normal text-right">Median ask</th>
              <th className="py-1 font-normal text-right">Listed</th>
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map((p) => (
              <tr key={p.day} className="border-t border-forest-600/30">
                <td className="py-1">{shortDate(p.day)}</td>
                <td className="py-1 text-right">{fullUsd((p.median_cents as number) / 100)}</td>
                <td className="py-1 text-right">{p.active_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
