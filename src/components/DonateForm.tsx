"use client";

import type { FormEvent } from "react";
import { useState } from "react";

const PRESETS = [25, 50, 100, 250, 500];

/** Pick a suggested amount or type any amount, then give by card on Stripe. No sign-in needed. */
export default function DonateForm() {
  const [preset, setPreset] = useState<number | null>(100);
  const [custom, setCustom] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const amount = custom.trim() ? custom.trim().replace(/[$,\s]/g, "") : preset ? String(preset) : "";
  const shown = amount && Number(amount) > 0 ? `$${Number(amount).toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!amount) {
      setError("Please choose or enter an amount.");
      return;
    }
    const form = new FormData(e.currentTarget);
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/donate/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, website: String(form.get("website") ?? "") }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) throw new Error(body.error || "Something went wrong. Please try again.");
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3" role="group" aria-label="Suggested amounts">
        {PRESETS.map((p) => {
          const active = !custom.trim() && preset === p;
          return (
            <button
              key={p}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setPreset(p);
                setCustom("");
                setError("");
              }}
              className={`rounded border py-3 font-display text-lg transition-colors ${
                active
                  ? "border-gold-400 bg-gold-400 text-forest-950"
                  : "border-gold-400/30 text-cream-100 hover:border-gold-400 hover:text-gold-300"
              }`}
            >
              ${p}
            </button>
          );
        })}
      </div>

      <div>
        <label htmlFor="donate-amount" className="block text-sm text-cream-200 mb-1">
          Or enter any amount
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cream-300">$</span>
          <input
            id="donate-amount"
            inputMode="decimal"
            autoComplete="off"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value.replace(/[^\d.,]/g, ""));
              setError("");
            }}
            placeholder="Other amount"
            className="w-full bg-forest-800 border border-forest-600/50 rounded pl-8 pr-4 py-3 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60 transition-colors"
          />
        </div>
      </div>

      {/* Honeypot for spam bots — hidden from people and screen readers */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-300 bg-red-900/30 border border-red-400/30 rounded px-4 py-3" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="btn-gold w-full py-4 rounded font-semibold tracking-widest uppercase disabled:opacity-60"
      >
        {sending ? "Opening secure payment…" : shown ? `Donate ${shown}` : "Donate"}
      </button>
      <p className="text-center text-xs text-cream-400">Secure card payment by Stripe. A thank-you and receipt are emailed to you.</p>
    </form>
  );
}
