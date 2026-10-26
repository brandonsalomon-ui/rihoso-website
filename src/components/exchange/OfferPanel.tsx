"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { inputClass } from "./SignInForm";

export type OfferView = {
  id: string;
  amount: string;
  allowsShipping: boolean;
  allowsPickup: boolean;
  status: "open" | "paid" | "cancelled" | "expired";
  expiresAt: string;
};

/** Seller: set the agreed price. Buyer: pay it. Shown at the top of a conversation. */
export default function OfferPanel({
  role,
  conversationId,
  listingOpen,
  listingAllowsShipping,
  listingAllowsPickup,
  offer,
  orderId,
}: {
  role: "buyer" | "seller";
  conversationId: string;
  listingOpen: boolean;
  listingAllowsShipping: boolean;
  listingAllowsPickup: boolean;
  offer: OfferView | null;
  orderId: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [fulfillment, setFulfillment] = useState<"ship" | "pickup">(offer?.allowsShipping === false ? "pickup" : "ship");

  async function createOffer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    const res = await fetch("/api/marketplace/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        amount: f.get("amount"),
        allowsShipping: f.get("ship") === "on",
        allowsPickup: f.get("pickup") === "on",
      }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setError(json.error || "Couldn't create the offer.");
    else router.refresh();
  }

  async function withdraw() {
    if (!offer) return;
    setBusy(true);
    await fetch(`/api/marketplace/offers?id=${offer.id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  async function pay() {
    if (!offer) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/marketplace/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId: offer.id, fulfillment, accept: agreed }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.url) {
      setError(json.error || "Couldn't start checkout.");
      setBusy(false);
      return;
    }
    window.location.href = json.url;
  }

  if (orderId) {
    return (
      <a href={`/marketplace/orders/${orderId}`} className="block panel-lux rounded-xl px-6 py-4 border border-gold-400/40 hover:bg-gold-400/5">
        <p className="text-gold-300 font-semibold">Sold — view the order →</p>
      </a>
    );
  }

  const openOffer = offer && offer.status === "open" && new Date(offer.expiresAt) > new Date() ? offer : null;

  if (role === "buyer") {
    if (!openOffer) return null;
    return (
      <div className="panel-lux rounded-xl p-6 border border-gold-400/40 space-y-4">
        <p className="text-cream-50 text-lg">
          The seller will sell to you for <span className="text-gold-300 font-semibold">{openOffer.amount}</span>
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-cream-200">
          {openOffer.allowsShipping && (
            <label className="flex items-center gap-2">
              <input type="radio" name="fulfillment" checked={fulfillment === "ship"} onChange={() => setFulfillment("ship")} className="accent-gold-400" />
              Ship to me (insured, signature required)
            </label>
          )}
          {openOffer.allowsPickup && (
            <label className="flex items-center gap-2">
              <input type="radio" name="fulfillment" checked={fulfillment === "pickup"} onChange={() => setFulfillment("pickup")} className="accent-gold-400" />
              Local pickup
            </label>
          )}
        </div>
        <ul className="text-xs text-cream-300 space-y-1 list-disc pl-5">
          <li>Price {openOffer.amount}{fulfillment === "ship" ? ", including insured shipping" : ""}; any sales tax is shown before you pay.</li>
          <li>
            {fulfillment === "ship"
              ? "The seller ships within 3 business days, or you can cancel for a full refund."
              : "Collect within 7 days, or the order is cancelled and refunded."}
          </li>
          <li>RIHOSO holds your payment. After you confirm {fulfillment === "ship" ? "receipt" : "collection"}, you have 72 hours to inspect the watch and report a problem.</li>
          <li>Returns only if the watch is materially not as described. The seller sells the watch; RIHOSO runs the Exchange.</li>
        </ul>
        <label className="flex items-start gap-3 text-sm text-cream-200 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 accent-gold-400" />
          <span>
            I agree to the{" "}
            <a href="/terms" target="_blank" className="text-gold-400 hover:text-gold-300 underline">Terms of Use</a>, including the
            inspection and returns rules above.
          </span>
        </label>
        <button onClick={pay} disabled={busy || !agreed} className="btn-gold px-8 py-3 rounded font-semibold disabled:opacity-60">
          {busy ? "Opening secure checkout…" : `Pay ${openOffer.amount}`}
        </button>
        <p className="text-xs text-cream-400">
          Paid securely by card through Stripe. Offer expires{" "}
          {new Date(openOffer.expiresAt).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" })}.
        </p>
        {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
      </div>
    );
  }

  // Seller
  if (!listingOpen) return null;
  return (
    <div className="panel-lux rounded-xl p-6 space-y-4">
      {openOffer ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-cream-100">
            You offered this buyer <span className="text-gold-300 font-semibold">{openOffer.amount}</span> — waiting for payment.
          </p>
          <button onClick={withdraw} disabled={busy} className="text-sm text-cream-400 hover:text-red-300">Withdraw offer</button>
        </div>
      ) : (
        <form onSubmit={createOffer} className="space-y-3">
          <p className="text-cream-100 font-semibold">Agreed on a price? Sell to this buyer</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <input name="amount" required inputMode="decimal" placeholder="Final price, e.g. 4,950" className={inputClass + " sm:max-w-xs"} />
            <label className="flex items-center gap-2 text-sm text-cream-200">
              <input type="checkbox" name="ship" defaultChecked={listingAllowsShipping} className="accent-gold-400" /> I&apos;ll ship it
            </label>
            <label className="flex items-center gap-2 text-sm text-cream-200">
              <input type="checkbox" name="pickup" defaultChecked={listingAllowsPickup} className="accent-gold-400" /> Local pickup
            </label>
          </div>
          <button disabled={busy} className="btn-gold px-6 py-2 rounded font-semibold disabled:opacity-60">
            {busy ? "Sending…" : "Send buyer a checkout link"}
          </button>
          <p className="text-xs text-cream-400">The buyer gets 72 hours to pay. The price includes insured shipping if you ship.</p>
        </form>
      )}
      {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
    </div>
  );
}
