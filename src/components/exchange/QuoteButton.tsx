"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Admin: send (or revise) a repair quote. Paste the watchmaker's quote as the reply to the customer. */
export default function QuoteButton({ id, hasQuote }: { id: string; hasQuote: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    if (!note.trim()) return setError("Paste your reply to the customer.");
    if (!amount.trim()) return setError("Enter the total quote amount.");
    setBusy(true);
    setError("");
    const res = await fetch("/api/marketplace/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "quote", id, amount, note }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(json.error || "Failed");
    setOpen(false);
    setAmount("");
    setNote("");
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-gold px-3 py-1.5 rounded text-xs font-semibold">
        {hasQuote ? "Revise quote" : "Send quote"}
      </button>
    );
  }

  return (
    <div className="w-full mt-1 p-3 rounded border border-gold-400/30 bg-forest-900/60">
      <label className="block text-xs text-cream-300 mb-1">
        Reply to the customer (paste the watchmaker&apos;s quote here; line breaks are kept)
      </label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={8}
        maxLength={4000}
        className="w-full rounded bg-forest-950 border border-forest-600 text-cream-100 p-2 text-sm"
        placeholder="e.g. Full service, new crystal and gaskets, pressure test. 2-year warranty. About 6 weeks."
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="text-xs text-cream-300">Total $</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          className="w-28 rounded bg-forest-950 border border-forest-600 text-cream-100 px-2 py-1 text-sm"
          placeholder="650"
        />
        <button onClick={send} disabled={busy} className="btn-gold px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-60">
          {busy ? "Sending…" : "Send to customer"}
        </button>
        <button onClick={() => setOpen(false)} disabled={busy} className="text-xs text-cream-400 hover:text-cream-200">
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-300 mt-1">{error}</p>}
    </div>
  );
}
