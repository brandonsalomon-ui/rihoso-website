import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ExchangeNav from "@/components/exchange/ExchangeNav";
import OrderActions from "@/components/exchange/OrderActions";
import { formatUsd } from "@/lib/marketplace";
import { INSPECTION_HOURS, fmtWhen, getOrder, isAdmin } from "@/lib/orders";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Order", robots: { index: false } };
export const dynamic = "force-dynamic";

const STEPS_SHIP = ["Paid — held by RIHOSO", "Shipped", `Received — ${INSPECTION_HOURS}h inspection`, "Payment released"];
const STEPS_PICKUP = ["Paid — held by RIHOSO", `Collected — ${INSPECTION_HOURS}h inspection`, "Payment released"];

function stepIndex(status: string, pickup: boolean) {
  if (pickup) return { paid_held: 0, delivered: 1, released: 2 }[status] ?? 0;
  return { paid_held: 0, shipped: 1, delivered: 2, released: 3 }[status] ?? 0;
}

function Decision({ note, at }: { note: string | null; at: string | null }) {
  if (!note) return null;
  return (
    <div className="mt-3 border-l-2 border-gold-400 pl-3 text-sm">
      <p className="text-gold-300 text-xs uppercase tracking-widest mb-1">RIHOSO&apos;s decision{at ? ` · ${fmtWhen(at)}` : ""}</p>
      <p className="text-cream-100 whitespace-pre-line">{note}</p>
      <p className="text-cream-400 text-xs mt-2">
        Disagree? Email info@rihoso.com within 7 days with the order number and any new evidence, and we&apos;ll reconsider.
        This review isn&apos;t arbitration and doesn&apos;t affect your rights with your card issuer or in court.
      </p>
    </div>
  );
}

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" }) : "";
}

export default async function OrderPage({ params }: { params: { id: string } }) {
  const { supabase, user } = await getUser();
  if (!user) redirect(`/marketplace/sign-in?next=/marketplace/orders/${params.id}`);
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const order = await getOrder(params.id);
  if (!order) notFound();
  const viewerIsAdmin = order.buyer_id !== user.id && order.seller_id !== user.id ? await isAdmin(user.id) : false;
  if (order.buyer_id !== user.id && order.seller_id !== user.id && !viewerIsAdmin) notFound();
  // Admins viewing someone else's order see the seller's view (payout + address), read-only.
  const isSeller = order.seller_id === user.id || viewerIsAdmin;

  const { data: listing } = await (viewerIsAdmin ? createAdminClient() : supabase).from("listings").select("id, title, brand").eq("id", order.listing_id).maybeSingle();
  const pickup = order.fulfillment === "pickup";
  const steps = pickup ? STEPS_PICKUP : STEPS_SHIP;
  const current = stepIndex(order.status, pickup);
  const addr = order.shipping_address;

  return (
    <>
      <ExchangeNav signedIn />
      <section className="py-12 bg-forest-800 min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <p className="text-gold-400 text-xs uppercase tracking-[0.2em]">{viewerIsAdmin ? "Order (admin view)" : isSeller ? "You sold" : "You bought"}</p>
            <h1 className="font-display text-3xl text-cream-50">
              {listing ? <Link href={`/marketplace/listings/${listing.id}`}>{listing.title}</Link> : "Watch"}
            </h1>
            <p className="text-cream-300 mt-1">
              {formatUsd(order.amount_cents)} · {pickup ? "Local pickup" : "Insured shipping"} · Order placed {fmtDate(order.created_at)}
            </p>
          </div>

          {order.status === "pending_payment" ? (
            <p className="panel-lux rounded-xl p-6 text-cream-200">Waiting for payment.</p>
          ) : order.status === "disputed" ? (
            <div className="rounded-xl border border-red-400/40 bg-red-900/20 p-6 text-cream-100">
              <p className="font-semibold mb-1">
                {order.return_approved_at ? "Return approved — payment on hold until the watch is back" : "Problem reported — payment on hold"}
              </p>
              <p className="text-sm text-cream-300">
                {order.return_approved_at
                  ? "The buyer is refunded in full once the seller confirms the return, or 2 business days after verified delivery to the seller unless they report a specific problem."
                  : "RIHOSO is reviewing this order. Both sides can send evidence (photos, tracking, messages); sellers should respond within 2 business days. You'll get a written decision."}
              </p>
              {order.dispute_reason && <p className="mt-3 text-sm whitespace-pre-line">Buyer&apos;s report: “{order.dispute_reason}”</p>}
              {order.return_tracking && (
                <p className="mt-2 text-sm text-cream-200">Return shipped: {order.return_carrier} {order.return_tracking}</p>
              )}
              {order.return_problem && <p className="mt-2 text-sm text-cream-200">Seller&apos;s report on the return: “{order.return_problem}”</p>}
              <Decision note={order.decision_note} at={order.decided_at} />
            </div>
          ) : order.status === "refunded" || order.status === "cancelled" ? (
            <div className="panel-lux rounded-xl p-6 text-cream-200">
              <p>{order.status === "cancelled" ? "This order was cancelled and the buyer refunded in full." : "This order was refunded to the buyer in full."}</p>
              <Decision note={order.decision_note} at={order.decided_at} />
            </div>
          ) : (
            <ol className="panel-lux rounded-xl p-6 grid gap-3" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
              {steps.map((s, i) => (
                <li key={s} className="text-center">
                  <span className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full border text-sm ${i <= current ? "bg-gold-400 text-forest-950 border-gold-400" : "border-forest-600 text-cream-400"}`}>
                    {i + 1}
                  </span>
                  <span className={`text-xs ${i <= current ? "text-cream-100" : "text-cream-400"}`}>{s}</span>
                </li>
              ))}
            </ol>
          )}

          <div className="panel-lux rounded-xl p-6 grid sm:grid-cols-2 gap-6 text-sm">
            <div>
              <h2 className="text-gold-400 uppercase tracking-widest text-xs mb-2">Payment</h2>
              <p className="text-cream-200">Sale price: {formatUsd(order.amount_cents)}</p>
              {order.refunded_amount_cents > 0 && order.refunded_amount_cents < order.amount_cents && (
                <p className="text-cream-300">Refunded to buyer: −{formatUsd(order.refunded_amount_cents)}</p>
              )}
              {isSeller && (
                <>
                  <p className="text-cream-300">RIHOSO fee: −{formatUsd(order.commission_cents)}</p>
                  <p className="text-cream-100 font-semibold">
                    Your payout: {formatUsd(order.seller_payout_cents ?? order.amount_cents - order.refunded_amount_cents - order.commission_cents)}
                  </p>
                </>
              )}
              {order.released_at && <p className="text-cream-300 mt-2">Released {fmtDate(order.released_at)}</p>}
              {order.status === "paid_held" && order.ship_by && (
                <p className="text-cream-300 mt-2">Ship by {fmtWhen(order.ship_by)}</p>
              )}
              {order.status === "paid_held" && order.pickup_deadline && (
                <p className="text-cream-300 mt-2">Pickup by {fmtWhen(order.pickup_deadline)}, or the order is cancelled and refunded.</p>
              )}
              {order.status === "delivered" && order.auto_release_at && (
                <p className="text-cream-200 mt-2">
                  Inspection ends {fmtWhen(order.auto_release_at)}. Payment releases then unless a problem is reported.
                </p>
              )}
            </div>
            <div>
              <h2 className="text-gold-400 uppercase tracking-widest text-xs mb-2">{pickup ? "Pickup" : "Shipping"}</h2>
              {pickup ? (
                <p className="text-cream-300">Arrange a time and place in your messages. Meet somewhere public, inspect the watch, then the buyer confirms here.</p>
              ) : (
                <>
                  {isSeller && addr && (
                    <p className="text-cream-200 whitespace-pre-line">
                      {[order.shipping_name, addr.line1, addr.line2, `${addr.city ?? ""}, ${addr.state ?? ""} ${addr.postal_code ?? ""}`, addr.phone ? `Phone: ${addr.phone}` : null]
                        .filter(Boolean)
                        .join("\n")}
                    </p>
                  )}
                  {order.tracking_number ? (
                    <p className="text-cream-200 mt-2">{order.shipping_carrier}: {order.tracking_number}</p>
                  ) : (
                    <p className="text-cream-400 mt-2">Not shipped yet.</p>
                  )}
                </>
              )}
            </div>
          </div>

          {viewerIsAdmin && (
            <p className="text-sm text-gold-300">
              Admin view — resolve problems from the <Link href="/marketplace/admin" className="underline">admin page</Link>.
            </p>
          )}
          {order.status === "released" && <Decision note={order.decision_note} at={order.decided_at} />}
          {!viewerIsAdmin && (
            <OrderActions
              orderId={order.id}
              role={isSeller ? "seller" : "buyer"}
              status={order.status}
              fulfillment={order.fulfillment}
              inspectionHours={INSPECTION_HOURS}
              shipOverdue={Boolean(order.ship_by && new Date(order.ship_by) < new Date())}
              deliveryReported={Boolean(order.delivery_reported_at)}
              handoverReported={Boolean(order.handover_reported_at)}
              returnApproved={Boolean(order.return_approved_at)}
              returnShipped={Boolean(order.return_shipped_at)}
              returnProblem={Boolean(order.return_problem_at)}
            />
          )}

          {order.conversation_id && (
            <Link href={`/marketplace/messages/${order.conversation_id}`} className="inline-block text-gold-400 hover:text-gold-300 text-sm">
              Message the {isSeller ? "buyer" : "seller"} →
            </Link>
          )}
          <p className="text-xs text-cream-400 leading-relaxed">
            RIHOSO holds the buyer&apos;s payment until the buyer accepts the watch, or until {INSPECTION_HOURS} hours after
            verified {pickup ? "handover" : "receipt"} with no problem reported. Returns are accepted only if the watch is
            materially not as described. RIHOSO runs the Exchange; the seller sells the watch. See the{" "}
            <Link href="/terms" className="underline">Terms of Use</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
