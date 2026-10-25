"use client";

import Image from "next/image";
import { useState } from "react";

export default function PhotoViewer({ photos, alt }: { photos: { id: string; url: string }[]; alt: string }) {
  const [i, setI] = useState(0);
  if (!photos.length) {
    return <div className="aspect-square rounded-xl bg-forest-900 flex items-center justify-center text-cream-400">No photos</div>;
  }
  const current = photos[Math.min(i, photos.length - 1)];
  return (
    <div>
      <div className="relative aspect-square rounded-xl overflow-hidden bg-forest-900">
        <Image src={current.url} alt={alt} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain" />
      </div>
      {photos.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {photos.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Show photo ${idx + 1}`}
              className={`relative aspect-square rounded overflow-hidden border ${idx === i ? "border-gold-400" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              <Image src={p.url} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
