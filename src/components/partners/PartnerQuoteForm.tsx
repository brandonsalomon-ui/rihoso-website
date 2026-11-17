"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { inputClass } from "@/components/exchange/SignInForm";
import { FEE_SCHEDULE_TEXT, referralFeeCents } from "@/lib/repair-partner-rules";

type Existing = {
  price_cents: number | null;
  includes: string | null;
  turnaround: string | null;
  warranty: string | null;
  dropoff: boolean;
  notes: string | null;
};

const label = "block text-sm text-cream-200 mb-1";

/** The standard quote every partner sends, so customers can compare like for like. */
export default function PartnerQuoteForm({ requestId, existing }: { requestId: string; existing: Existing | null }) {
  const router = useRouter();
  const [price, setPrice] = useState(existing?.price_cents ? String(existing.price_cents / 100) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const cents = Math.round(parseFloat(price.replace(/[$,\s]/g, "")) * 100);
  const fee = Number.isFinite(cents) && cents > 0 ? referralFeeCents(cents) : null;

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setSaved(false);
    const res = await fetch("/api/partner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, ...body }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Something went wrong.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    post({
      action: "quote",
      price,
      includes: f.get("includes"),
      turnaround: f.get("turnaround"),
      warranty: f.get("warranty"),
      dropoff: f.get("dropoff") === "on",
      notes: f.get("notes"),
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label} htmlFor="q-price">Total price to the customer ($)</label>
          <input id="q-price" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" required className={inputClass} placeholder="650" />
          {fee !== null && (
            <p className="text-xs text-cream-400 mt-1">
              Includes RIHOSO&apos;s ${fee / 100} referral fee ({FEE_SCHEDULE_TEXT}).
            </p>
          )}
        </div>
        <div>
          <label className={label} htmlFor="q-turn">Turnaround</label>
          <input id="q-turn" name="turnaround" required maxLength={120} defaultValue={existing?.turnaround ?? ""} className={inputClass} placeholder="4–6 weeks" />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="q-inc">What the price includes</label>
          <textarea id="q-inc" name="includes" required minLength={10} maxLength={2000} rows={4} defaultValue={existing?.includes ?? ""} className={inputClass}
            placeholder="Full movement service: disassembly, cleaning, lubrication, regulation. New gaskets and pressure test. Case and bracelet cleaned." />
        </div>
        <div>
          <label className={label} htmlFor="q-war">Warranty</label>
          <input id="q-war" name="warranty" maxLength={120} defaultValue={existing?.warranty ?? ""} className={inputClass} placeholder="2 years on the service" />
        </div>
        <label className="flex items-center gap-3 text-sm text-cream-200 cursor-pointer sm:mt-7">
          <input type="checkbox" name="dropoff" defaultChecked={existing?.dropoff ?? true} className="accent-gold-400" />
          Customer can drop the watch off in person
        </label>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="q-notes">Notes for the customer <span className="text-cream-400">(optional)</span></label>
          <textarea id="q-notes" name="notes" maxLength={2000} rows={3} defaultValue={existing?.notes ?? ""} className={inputClass}
            placeholder="Price confirmed once we open the case; if parts are needed we'll call before doing anything." />
        </div>
      </div>
      {error && <p className="text-sm text-red-300 bg-red-900/30 border border-red-400/30 rounded px-4 py-3" role="alert">{error}</p>}
      {saved && <p className="text-sm text-green-300" role="status">Sent. The customer has been emailed.</p>}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className="btn-gold px-6 py-3 rounded font-semibold disabled:opacity-60">
          {busy ? "Sending…" : existing?.price_cents ? "Update quote" : "Send quote"}
        </button>
        {!existing?.price_cents && (
          <button type="button" disabled={busy} onClick={() => post({ action: "decline" })}
            className="px-6 py-3 rounded border border-cream-200/30 text-cream-200 hover:border-gold-400 disabled:opacity-60">
            Not for us — decline
          </button>
        )}
      </div>
    </form>
  );
}
