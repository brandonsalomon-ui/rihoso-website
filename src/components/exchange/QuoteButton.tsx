"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Admin: send (or revise) a repair quote. */
export default function QuoteButton({ id, hasQuote }: { id: string; hasQuote: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run() {
    const amount = prompt("Quote amount in dollars (e.g. 650):");
    if (!amount) return;
    const note = prompt("What's included? (shown to the customer — e.g. full service, new crystal, 2-year warranty, about 6 weeks)") ?? "";
    setBusy(true);
    setError("");
    const res = await fetch("/api/marketplace/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "quote", id, amount, note }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setError(json.error || "Failed");
    else router.refresh();
  }
  return (
    <span className="inline-flex flex-col">
      <button onClick={run} disabled={busy} className="btn-gold px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-60">
        {busy ? "…" : hasQuote ? "Revise quote" : "Send quote"}
      </button>
      {error && <span className="text-xs text-red-300 mt-1">{error}</span>}
    </span>
  );
}
