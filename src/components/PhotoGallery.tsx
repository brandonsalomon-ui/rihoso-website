"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { Photo } from "@/lib/photos";

/**
 * Mosaic of photos in gold frames. Clicking one opens a full-screen viewer
 * with previous / next buttons, arrow-key navigation and Esc to close.
 * `layout` picks which tiles span two cells so the mosaic stays balanced.
 */
export default function PhotoGallery({
  photos,
  layout = [],
  className = "",
}: {
  photos: Photo[];
  /** Tailwind span classes per photo index, e.g. ["md:col-span-2 md:row-span-2"] */
  layout?: string[];
  className?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (d: number) => setOpen((i) => (i === null ? i : (i + d + photos.length) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, step]);

  const current = open !== null ? photos[open] : null;

  return (
    <>
      <div className={`grid grid-cols-2 md:grid-cols-4 auto-rows-[160px] sm:auto-rows-[200px] gap-3 sm:gap-4 ${className}`}>
        {photos.map((p, i) => (
          <button
            key={p.src}
            type="button"
            onClick={() => setOpen(i)}
            className={`group relative overflow-hidden rounded-xl p-[1px] bg-gradient-to-br from-gold-300/70 via-gold-500/20 to-gold-400/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 ${
              layout[i] ?? ""
            }`}
            aria-label={`View photo: ${p.caption ?? p.alt}`}
          >
            <span className="relative block w-full h-full overflow-hidden rounded-[11px]">
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                style={{ objectPosition: p.focus }}
              />
              <span className="absolute inset-0 bg-gradient-to-t from-forest-950/85 via-forest-950/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
              {p.caption && (
                <span className="absolute left-4 right-4 bottom-3 text-left font-display text-sm sm:text-base text-cream-50 translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                  {p.caption}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {current && open !== null && (
        <div
          className="fixed inset-0 z-[100] bg-forest-950/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-10"
          role="dialog"
          aria-modal="true"
          aria-label={current.caption ?? current.alt}
          onClick={close}
        >
          <figure className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full flex-1 min-h-0">
              <Image src={current.src} alt={current.alt} fill sizes="100vw" className="object-contain" priority />
            </div>
            {current.caption && (
              <figcaption className="mt-4 font-display text-lg text-cream-100 text-center">
                {current.caption}
                <span className="ml-3 text-sm text-gold-400">
                  {open + 1} / {photos.length}
                </span>
              </figcaption>
            )}
          </figure>
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 w-11 h-11 rounded-full border border-gold-400/50 text-gold-300 hover:bg-gold-400 hover:text-forest-950 transition-colors flex items-center justify-center"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => (e.stopPropagation(), step(-1))}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-gold-400/50 text-gold-300 hover:bg-gold-400 hover:text-forest-950 transition-colors flex items-center justify-center"
                aria-label="Previous photo"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => (e.stopPropagation(), step(1))}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-gold-400/50 text-gold-300 hover:bg-gold-400 hover:text-forest-950 transition-colors flex items-center justify-center"
                aria-label="Next photo"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
