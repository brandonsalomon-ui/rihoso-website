export type WatchCondition = "new" | "unworn" | "excellent" | "very_good" | "good" | "fair" | "for_parts";
export type ListingStatus = "draft" | "active" | "reserved" | "sold" | "withdrawn" | "removed";
export type ValidationStatus = "none" | "requested" | "in_progress" | "passed" | "concerns";

export const CONDITIONS: { value: WatchCondition; label: string }[] = [
  { value: "new", label: "New" },
  { value: "unworn", label: "Unworn" },
  { value: "excellent", label: "Excellent" },
  { value: "very_good", label: "Very good" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "for_parts", label: "For parts / repair" },
];

export const conditionLabel = (c: WatchCondition) => CONDITIONS.find((x) => x.value === c)?.label ?? c;

export type ListingPhoto = { id: string; storage_path: string; position: number };

export type Listing = {
  id: string;
  seller_id: string;
  title: string;
  brand: string;
  model: string | null;
  reference: string | null;
  year: number | null;
  condition: WatchCondition;
  has_box: boolean;
  has_papers: boolean;
  description: string;
  price_cents: number;
  status: ListingStatus;
  validation_status: ValidationStatus;
  validation_notes: string | null;
  allows_shipping: boolean;
  allows_pickup: boolean;
  pickup_area: string | null;
  published_at: string | null;
  created_at: string;
  listing_photos?: ListingPhoto[];
  profiles?: { display_name: string; is_member: boolean } | null;
};

export const LISTING_SELECT =
  "id, seller_id, title, brand, model, reference, year, condition, has_box, has_papers, description, price_cents, status, validation_status, validation_notes, allows_shipping, allows_pickup, pickup_area, published_at, created_at, listing_photos(id, storage_path, position), profiles!listings_seller_id_fkey(display_name, is_member)";

export function sortedPhotos(l: Listing) {
  return [...(l.listing_photos ?? [])].sort((a, b) => a.position - b.position);
}
