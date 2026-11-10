"use client";

import { useState } from "react";
import Image from "next/image";
import { trackTikTok } from "@/lib/tiktok";
import { WOLF_MAX_QTY, wolfPrice, type WolfProduct } from "@/lib/wolf-catalog";

/** Product gallery, colour picker, quantity and the buy button for one WOLF item. */
export default function WolfBuyBox({ product }: { product: WolfProduct }) {
  const [colorIdx, setColorIdx] = useState(0);
  const [imageIdx, setImageIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [shipState, setShipState] = useState<"" | "RI" | "OTHER">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const color = product.colors[colorIdx];
  const image = color.images[imageIdx] ?? color.images[0];

  async function buy() {
    if (!shipState) {
      setError("Please choose where this is shipping.");
      return;
    }
    setBusy(true);
    setError("");
    trackTikTok("AddToCart", {
      content_id: color.sku,
      content_name: product.name,
      content_type: "product",
      value: (product.priceCents * qty) / 100,
      currency: "USD",
    });
    try {
      const res = await fetch("/api/wolf/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: product.slug, sku: color.sku, quantity: qty, shipState }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Couldn't start checkout. Please try again.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start checkout. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-start">
      {/* gallery */}
      <div>
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-cream-50 p-[1px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]">
          <Image
            key={image}
            src={image}
            alt={`${product.name}${product.colors.length > 1 ? ` in ${color.name}` : ""}`}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-contain p-6"
          />
        </div>
        {color.images.length > 1 && (
          <div className="mt-4 flex gap-3">
            {color.images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setImageIdx(i)}
                aria-label={`Show photo ${i + 1}`}
                className={`relative h-20 w-20 rounded-lg overflow-hidden bg-cream-50 border-2 transition-colors ${
                  i === imageIdx ? "border-gold-400" : "border-transparent hover:border-gold-400/50"
                }`}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-contain p-1" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* details */}
      <div className="panel-lux rounded-2xl p-6 sm:p-8">
        <p className="text-gold-400 text-xs uppercase tracking-[0.3em]">WOLF 1834 · {product.collection}</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl text-cream-50 font-bold leading-tight">{product.name}</h1>
        <p className="mt-4 text-2xl text-cream-100">{wolfPrice(product.priceCents)}</p>
        <p className="mt-5 text-cream-200 leading-relaxed">{product.summary}</p>

        <ul className="mt-5 space-y-2 text-cream-200">
          {product.features.map((f) => (
            <li key={f} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
              {f}
            </li>
          ))}
        </ul>

        {product.colors.length > 1 && (
          <fieldset className="mt-7">
            <legend className="text-sm text-cream-300">
              Color: <span className="text-cream-50">{color.name}</span>
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.colors.map((c, i) => (
                <button
                  key={c.sku}
                  type="button"
                  onClick={() => {
                    setColorIdx(i);
                    setImageIdx(0);
                  }}
                  aria-pressed={i === colorIdx}
                  className={`flex items-center gap-2 rounded-full border px-2 py-1 pr-3 text-sm transition-colors ${
                    i === colorIdx ? "border-gold-400 text-cream-50 bg-forest-700/60" : "border-cream-300/25 text-cream-300 hover:border-gold-400/60"
                  }`}
                >
                  <span className="relative h-7 w-7 rounded-full overflow-hidden bg-cream-50">
                    <Image src={c.images[0]} alt="" fill sizes="28px" className="object-cover" />
                  </span>
                  {c.name}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <div className="mt-7 flex flex-wrap items-end gap-4">
          <label className="text-sm text-cream-300">
            Quantity
            <select
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="mt-2 block rounded border border-cream-300/30 bg-forest-900 px-3 py-2.5 text-cream-50"
            >
              {Array.from({ length: WOLF_MAX_QTY }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-cream-300">
            Shipping to
            <select
              value={shipState}
              onChange={(e) => {
                setShipState(e.target.value as "" | "RI" | "OTHER");
                setError("");
              }}
              className="mt-2 block rounded border border-cream-300/30 bg-forest-900 px-3 py-2.5 text-cream-50"
            >
              <option value="">Choose…</option>
              <option value="RI">Rhode Island</option>
              <option value="OTHER">Another US state</option>
            </select>
          </label>
          <button
            type="button"
            onClick={buy}
            disabled={busy}
            className="btn-gold flex-1 min-w-[200px] px-8 py-3.5 font-semibold tracking-widest uppercase disabled:opacity-60"
          >
            {busy ? "Opening checkout…" : `Buy now · ${wolfPrice(product.priceCents * qty)}`}
          </button>
        </div>
        {shipState === "RI" && (
          <p className="mt-3 text-sm text-cream-300">
            Rhode Island sales tax of {wolfPrice(Math.round(product.priceCents * qty * 0.07))} will be added at checkout.
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

        <div className="mt-7 border-t border-cream-300/10 pt-5 space-y-2 text-sm text-cream-300">
          <p>
            <span className="text-cream-100">Free shipping</span> — ships directly from WOLF within the US. Tracking is emailed
            when it ships.
          </p>
          <p>
            <span className="text-cream-100">Sales tax</span> — 7% Rhode Island sales tax is added only for orders
            shipping to Rhode Island.
          </p>
          <p>
            <span className="text-cream-100">Item {color.sku}</span> · Genuine WOLF, offered with Providence Diamond, an
            authorized WOLF retailer.
          </p>
        </div>
      </div>
    </div>
  );
}
