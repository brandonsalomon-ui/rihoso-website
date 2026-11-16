"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Customer: choose this workshop. Confirms first, since the choice shares their contact details. */
export default function ChooseQuoteButton({ quoteId, shop, price }: { quoteId: string; shop: string; price: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function choose() {
    if (!confirm(`Choose ${shop} at ${price}? They'll receive your contact details to arrange drop-off or shipping, and the other workshops will be told.`)) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/marketplace/repair-quotes/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setError(json.error || "Something went wrong.");
    else router.refresh();
  }

  return (
    <div>
      <button onClick={choose} disabled={busy} className="btn-gold w-full py-2.5 rounded font-semibold disabled:opacity-60">
        {busy ? "Choosing…" : `Choose ${shop}`}
      </button>
      {error && <p className="text-xs text-red-300 mt-1">{error}</p>}
    </div>
  );
}
