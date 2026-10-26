import Image from "next/image";
import Link from "next/link";
import { formatUsd } from "@/lib/marketplace";
import { conditionLabel, sortedPhotos, type Listing } from "@/lib/exchange-types";
import { photoUrl } from "@/lib/supabase/config";

export default function ListingCard({ listing }: { listing: Listing }) {
  const cover = sortedPhotos(listing)[0];
  const badge = listing.status === "sold" ? "Sold" : listing.status === "reserved" ? "Reserved" : null;
  return (
    <Link href={`/marketplace/listings/${listing.id}`} className="card-lux group block rounded-xl overflow-hidden">
      <div className="relative aspect-square bg-forest-900">
        {cover ? (
          <Image
            src={photoUrl(cover.storage_path)}
            alt={listing.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-cream-400 text-sm">No photo</div>
        )}
        {badge && (
          <span className="absolute top-3 left-3 bg-forest-950/85 text-gold-300 text-xs uppercase tracking-widest px-3 py-1 rounded">
            {badge}
          </span>
        )}
      </div>
      <div className="p-5">
        <p className="text-gold-400 text-xs uppercase tracking-[0.2em] mb-1">{listing.brand}</p>
        <h3 className="font-display text-lg text-cream-50 leading-snug line-clamp-2">{listing.title}</h3>
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <span className="font-display text-xl text-gold-foil">{formatUsd(listing.price_cents)}</span>
          <span className="text-xs text-cream-400">{conditionLabel(listing.condition)}</span>
        </div>
      </div>
    </Link>
  );
}
