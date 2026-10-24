"use client";

import { useEffect, useState } from "react";
import { WatchDial } from "./ornaments";

/** A watch dial whose hands show the current time in Rhode Island, with a sweeping seconds hand. */
export default function LiveDial({ className = "" }: { className?: string }) {
  const [t, setT] = useState<{ h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const read = () => {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
      }).formatToParts(new Date());
      const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
      const ms = new Date().getMilliseconds();
      setT({ h: get("hour") % 12, m: get("minute"), s: get("second") + ms / 1000 });
    };
    read();
    const id = setInterval(read, 125);
    return () => clearInterval(id);
  }, []);

  // Before hydration show the classic 10:10 pose.
  const hourDeg = t ? (t.h + t.m / 60) * 30 : 305;
  const minDeg = t ? (t.m + t.s / 60) * 6 : 60;
  const secDeg = t ? Math.floor(t.s * 8) * 6 / 8 : 0;

  return (
    <div className={`relative ${className}`} role="img" aria-label="Watch dial showing the current time in Rhode Island">
      <WatchDial hands={false} className="absolute inset-0 w-full h-full" />
      <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <g fill="currentColor">
          <g transform={`rotate(${hourDeg} 200 200)`}>
            <path d="M200 212 L195 200 L198 112 L200 104 L202 112 L205 200 Z" />
          </g>
          <g transform={`rotate(${minDeg} 200 200)`}>
            <path d="M200 214 L196.5 200 L199 54 L200 46 L201 54 L203.5 200 Z" />
          </g>
          <g transform={`rotate(${secDeg} 200 268)`}>
            <line x1="200" y1="274" x2="200" y2="242" stroke="currentColor" strokeWidth="1.2" />
          </g>
          <circle cx="200" cy="200" r="6" />
          <circle cx="200" cy="268" r="2.5" />
        </g>
      </svg>
    </div>
  );
}
