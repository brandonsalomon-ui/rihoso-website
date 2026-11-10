import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PageHero from "@/components/PageHero";
import TikTokPurchase from "@/components/TikTokPurchase";
import { isStripeConfigured } from "@/lib/stripe";
import { wolfPrice } from "@/lib/wolf-catalog";
import { finalizeWolfCheckout, type WolfOrder } from "@/lib/wolf-orders";

export const metadata: Metadata = { title: "Thank you for your order", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function WolfThankYou({ searchParams }: { searchParams: { session_id?: string } }) {
  const sessionId = searchParams.session_id ?? "";
  if (!isStripeConfigured() || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) redirect("/wolf");

  let order: WolfOrder | null = null;
  try {
    order = await finalizeWolfCheckout(sessionId);
  } catch (err) {
    console.error("[wolf] finalize failed", err);
  }
  if (order === null) redirect("/wolf");

  return (
    <>
      <PageHero eyebrow="The WOLF Collection" title={order.paid ? "Thank you for your order" : "Thank you"} />
      <section className="py-20 bg-forest-800 min-h-[40vh]">
        <div className="max-w-lg mx-auto px-4 text-center panel-lux rounded-xl p-8 space-y-4">
          {order.paid ? (
            <>
              <TikTokPurchase
                eventId={sessionId}
                value={order.subtotalCents / 100}
                contentId={order.sku}
                contentName={order.productName}
                quantity={order.quantity}
              />
              <p className="text-gold-400 text-sm uppercase tracking-[0.3em]">Order {order.ref}</p>
              <p className="text-cream-100 text-lg">
                {order.productName}
                {order.color ? ` — ${order.color}` : ""} × {order.quantity}
              </p>
              <p className="text-cream-300 text-sm">
                We&apos;ve received {wolfPrice(order.totalCents)}
                {order.taxCents ? ` (including ${wolfPrice(order.taxCents)} RI sales tax)` : ""}. Your order ships directly from
                WOLF, and we&apos;ll email your tracking number as soon as it&apos;s on its way. A confirmation is on its way to{" "}
                {order.email}.
              </p>
              <p className="text-cream-300 text-sm">Thank you for supporting the Rhode Island Horological Society.</p>
            </>
          ) : (
            <p className="text-cream-300">
              We&apos;re confirming your payment. This can take a moment — you&apos;ll get a confirmation email as soon as it goes
              through.
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/wolf" className="btn-gold px-6 py-3 font-semibold">
              Back to the collection
            </Link>
            <Link href="/memberships" className="px-6 py-3 rounded border border-cream-200/30 text-cream-100 hover:border-gold-400">
              Join RIHOSO
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
