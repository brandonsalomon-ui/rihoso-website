"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { inputClass } from "./SignInForm";

/**
 * Admin decision on a reported problem. Every money decision carries a written explanation,
 * which is emailed to both parties and shown on the order page.
 */
export default function DecisionPanel({
  orderId,
  amountLabel,
  returnApproved,
  returnShipped,
  returnReceived,
}: {
  orderId: string;
  amountLabel: string;
  returnApproved: boolean;
  returnShipped: boolean;
  returnReceived: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function post(body: Record<string, unknown>, confirmText: string) {
    if (!confirm(confirmText)) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/marketplace/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orderId, note, ...body }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setError(json.error || "Failed");
    else {
      setNote("");
      router.refresh();
    }
  }

  const btn = "px-4 py-2 rounded text-sm disabled:opacity-60";
  return (
    <div className="mt-3 space-y-3">
      {returnApproved && returnShipped && !returnReceived && (
        <button
          disabled={busy}
          onClick={() =>
            post({ action: "verify_return" }, "Tracking shows the return delivered to the seller? The buyer is refunded automatically in 2 business days unless the seller reports a problem.")
          }
          className={`${btn} border border-cream-200/30 text-cream-100 hover:border-gold-400`}
        >
          Return delivered (tracking checked)
        </button>
      )}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        className={inputClass + " text-sm"}
        placeholder="Your decision and the reason, in plain words. Both buyer and seller receive this, with a 7-day window to ask for reconsideration."
      />
      <div className="flex flex-wrap items-center gap-2">
        {!returnApproved && (
          <button
            disabled={busy}
            onClick={() => post({ action: "approve_return" }, "Approve a return? Payment stays held until the watch is back with the seller.")}
            className={`${btn} border border-gold-400/50 text-gold-200 hover:bg-gold-400/10`}
          >
            Approve return
          </button>
        )}
        <button
          disabled={busy}
          onClick={() => post({ action: "refund" }, `Refund the buyer ${amountLabel} in full now?`)}
          className={`${btn} border border-red-300/40 text-red-200 hover:bg-red-900/20`}
        >
          Refund in full now
        </button>
        <span className="flex items-center gap-1">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="$ amount"
            className={inputClass + " w-28 py-2 text-sm"}
            aria-label="Partial refund amount"
          />
          <button
            disabled={busy || !amount}
            onClick={() => post({ action: "partial_refund", amount }, `Refund $${amount} to the buyer and release the rest to the seller (fee reduced proportionally)?`)}
            className={`${btn} border border-cream-200/30 text-cream-100 hover:border-gold-400`}
          >
            Partial refund, release rest
          </button>
        </span>
        <button
          disabled={busy}
          onClick={() => post({ action: "release" }, "Release the held payment to the seller?")}
          className={`${btn} btn-gold`}
        >
          Release to seller
        </button>
      </div>
      {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
    </div>
  );
}
