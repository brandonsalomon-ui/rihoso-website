import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ExchangeNav from "@/components/exchange/ExchangeNav";
import PhotoViewer from "@/components/exchange/PhotoViewer";
import ContactSeller from "@/components/exchange/ContactSeller";
import SellerControls from "@/components/exchange/SellerControls";
import { COMMISSION, formatUsd } from "@/lib/marketplace";
import { LISTING_SELECT, conditionLabel, sortedPhotos, type Listing } from "@/lib/exchange-types";
import { isSupabaseConfigured, photoUrl } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function load(id: string) {
  if (!isSupabaseConfigured() || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { supabase, user } = await getUser();
  const { data } = await supabase.from("listings").select(LISTING_SELECT).eq("id", id).maybeSingle();
  if (!data) return null;
  const listing = data as unknown as Listing;
  let conversationId: string | null = null;
  if (user && user.id !== listing.seller_id) {
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", id)
      .eq("buyer_id", user.id)
      .maybeSingle();
    conversationId = conv?.id ?? null;
  }
  return { listing, user, conversationId };
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const res = await load(params.id);
  if (!res) return { title: "Listing not found" };
  const cover = sortedPhotos(res.listing)[0];
  return {
    title: res.listing.title,
    description: `${res.listing.brand} — ${formatUsd(res.listing.price_cents)} on the RIHOSO Watch Exchange`,
    openGraph: cover ? { images: [photoUrl(cover.storage_path)] } : undefined,
  };
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-forest-600/30 text-sm">
      <dt className="text-cream-400">{label}</dt>
      <dd className="text-cream-100 text-right">{value}</dd>
    </div>
  );
}

export default async function ListingPage({ params }: { params: { id: string } }) {
  const res = await load(params.id);
  if (!res) notFound();
  const { listing, user, conversationId } = res;
  const isSeller = user?.id === listing.seller_id;
  const photos = sortedPhotos(listing).map((p) => ({ id: p.id, url: photoUrl(p.storage_path) }));
  const open = listing.status === "active" || listing.status === "reserved";
  const seller = listing.profiles;

  return (
    <>
      <ExchangeNav signedIn={Boolean(user)} />
      <section className="py-12 sm:py-16 bg-forest-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/marketplace" className="text-sm text-gold-400 hover:text-gold-300">← All watches</Link>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
            <PhotoViewer photos={photos} alt={listing.title} />

            <div>
              <p className="text-gold-400 text-sm uppercase tracking-[0.2em] mb-2">{listing.brand}</p>
              <h1 className="font-display text-3xl sm:text-4xl text-cream-50 leading-tight">{listing.title}</h1>
              <p className="mt-4 font-display text-4xl text-gold-foil">{formatUsd(listing.price_cents)}</p>

              {listing.status !== "active" && (
                <p className="mt-3 inline-block text-xs uppercase tracking-widest bg-forest-950 text-gold-300 px-3 py-1 rounded">
                  {listing.status === "draft" ? "Draft — not visible to buyers" : listing.status}
                </p>
              )}

              <dl className="mt-6">
                <Detail label="Model" value={listing.model} />
                <Detail label="Reference" value={listing.reference} />
                <Detail label="Year" value={listing.year ? String(listing.year) : null} />
                <Detail label="Condition" value={conditionLabel(listing.condition)} />
                <Detail label="Box" value={listing.has_box ? "Included" : "Not included"} />
                <Detail label="Papers" value={listing.has_papers ? "Included" : "Not included"} />
                <Detail
                  label="Delivery"
                  value={[listing.allows_shipping && "Insured shipping (included)", listing.allows_pickup && `Local pickup${listing.pickup_area ? ` — ${listing.pickup_area}` : ""}`]
                    .filter(Boolean)
                    .join(" · ")}
                />
                <Detail label="Seller" value={seller ? `${seller.display_name}${seller.is_member ? " · RIHOSO member" : ""}` : null} />
              </dl>

              <div className="mt-8 space-y-4">
                {isSeller ? (
                  <SellerControls listingId={listing.id} status={listing.status} />
                ) : open ? (
                  user ? (
                    <ContactSeller listingId={listing.id} conversationId={conversationId} />
                  ) : (
                    <Link
                      href={`/marketplace/sign-in?next=/marketplace/listings/${listing.id}`}
                      className="btn-gold block text-center py-3 rounded font-semibold"
                    >
                      Sign in to message the seller
                    </Link>
                  )
                ) : null}
              </div>
            </div>
          </div>

          {listing.description && (
            <div className="mt-12 max-w-3xl">
              <h2 className="font-display text-2xl text-cream-50 mb-4">About this watch</h2>
              <p className="text-cream-200 whitespace-pre-line leading-relaxed">{listing.description}</p>
            </div>
          )}

          <p className="mt-12 text-xs text-cream-400 max-w-3xl leading-relaxed">
            Sold by an independent seller. RIHOSO runs the Exchange; it is not the seller and does not inspect or guarantee
            this item. Agree a price with the seller in messages, then pay through RIHOSO — your payment is held, and once
            the watch arrives you have 72 hours to inspect it. Returns only if it is materially not as described. See the{" "}
            <Link href="/terms" className="underline">Terms of Use</Link>. RIHOSO&apos;s fee (
            {COMMISSION.standard * 100}%, or {COMMISSION.member * 100}% for members) is paid by the seller.
          </p>
        </div>
      </section>
    </>
  );
}
