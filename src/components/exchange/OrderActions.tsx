"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { inputClass } from "./SignInForm";

type Props = {
  orderId: string;
  role: "buyer" | "seller";
  status: string;
  fulfillment: "ship" | "pickup";
  autoReleaseDays: number;
};

export default function OrderActions({ orderId, role, status, fulfillment, autoReleaseDays }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showDispute, setShowDispute] = useState(false);

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/marketplace/orders/${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setError(json.error || "Something went wrong.");
    else router.refresh();
  }

  function onShip(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    act({ action: "ship", carrier: f.get("carrier"), tracking: f.get("tracking") });
  }

  function onDispute(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    act({ action: "dispute", reason: new FormData(e.currentTarget).get("reason") });
  }

  const open = ["paid_held", "shipped", "delivered"].includes(status);
  if (!open) return null;

  return (
    <div className="panel-lux rounded-xl p-6 space-y-4">
      {role === "seller" && fulfillment === "ship" && status === "paid_held" && (
        <form onSubmit={onShip} className="space-y-3">
          <p className="text-cream-100 font-semibold">Ship the watch</p>
          <p className="text-sm text-cream-300">Ship fully insured with signature required, then enter the tracking details.</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <select name="carrier" required className={inputClass} defaultValue="">
              <option value="" disabled>Carrier</option>
              <option>UPS</option>
              <option>FedEx</option>
              <option>USPS</option>
              <option>DHL</option>
              <option>Other</option>
            </select>
            <input name="tracking" required minLength={6} placeholder="Tracking number" className={inputClass + " sm:col-span-2"} />
          </div>
          <button disabled={busy} className="btn-gold px-6 py-2 rounded font-semibold disabled:opacity-60">Mark as shipped</button>
        </form>
      )}
      {role === "seller" && status === "shipped" && (
        <div className="space-y-2">
          <p className="text-sm text-cream-300">
            When tracking shows the watch was delivered, mark it delivered. The buyer then has {autoReleaseDays} days to report a
            problem before your payment is released automatically.
          </p>
          <button disabled={busy} onClick={() => act({ action: "delivered" })} className="btn-gold px-6 py-2 rounded font-semibold disabled:opacity-60">
            Tracking shows delivered
          </button>
        </div>
      )}
      {role === "seller" && fulfillment === "pickup" && status === "paid_held" && (
        <p className="text-sm text-cream-300">Arrange pickup with the buyer in your messages. You&apos;ll be paid as soon as they confirm they have the watch.</p>
      )}
      {role === "seller" && status === "delivered" && (
        <p className="text-sm text-cream-300">Waiting for the buyer to confirm — or automatic release after {autoReleaseDays} days.</p>
      )}

      {role === "buyer" && (
        <>
          <p className="text-cream-100 font-semibold">
            {status === "paid_held" && fulfillment === "ship" ? "Waiting for the seller to ship." : "Have the watch?"}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              disabled={busy}
              onClick={() => {
                if (confirm("Confirm you received the watch and it matches the listing? This releases payment to the seller and can't be undone.")) act({ action: "confirm" });
              }}
              className="btn-gold px-6 py-2 rounded font-semibold disabled:opacity-60"
            >
              I received it as described — release payment
            </button>
            <button disabled={busy} onClick={() => setShowDispute((v) => !v)} className="px-6 py-2 rounded border border-red-300/40 text-red-200 hover:bg-red-900/20">
              Report a problem
            </button>
          </div>
          {showDispute && (
            <form onSubmit={onDispute} className="space-y-3">
              <textarea name="reason" required minLength={10} rows={4} className={inputClass} placeholder="What's wrong? (not as described, damaged, not received…)" />
              <button disabled={busy} className="px-6 py-2 rounded bg-red-800/60 text-cream-50 disabled:opacity-60">Send to RIHOSO</button>
            </form>
          )}
        </>
      )}
      {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
    </div>
  );
}
