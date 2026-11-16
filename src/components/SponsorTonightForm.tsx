"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { SPONSOR_LEVELS, SPONSOR_TERM_MONTHS, type SponsorLevelId } from "@/lib/sponsorship";
import { GuillocheRosette } from "./ornaments";

const inputClass =
  "w-full bg-forest-800 border border-forest-600/50 rounded px-4 py-3 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60 transition-colors";

const YEARS = SPONSOR_TERM_MONTHS / 12;

/** Pick Partial or Full, enter name and email, then pay by card on Stripe. No sign-in needed. */
export default function SponsorTonightForm() {
  const [level, setLevel] = useState<SponsorLevelId>("full");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const selected = SPONSOR_LEVELS.find((l) => l.id === level)!;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/sponsor/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          name: String(form.get("name") ?? "").trim(),
          email: String(form.get("email") ?? "").trim(),
          phone: String(form.get("phone") ?? "").trim(),
          recognizeAs: String(form.get("recognizeAs") ?? "").trim(),
          website: String(form.get("website") ?? ""),
          accept: form.get("agree") === "on",
        }),
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
    <div className="max-w-2xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {SPONSOR_LEVELS.map((l) => {
          const active = l.id === level;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => setLevel(l.id)}
              aria-pressed={active}
              className={`card-lux group relative overflow-hidden rounded-xl p-6 text-left transition-colors ${
                active ? "ring-2 ring-gold-400" : "opacity-80 hover:opacity-100"
              }`}
            >
              <div className="pointer-events-none absolute -right-14 -top-14 text-gold-400/[0.08]">
                <GuillocheRosette className="w-44 h-44" />
              </div>
              <p className="relative text-xs uppercase tracking-[0.25em] text-gold-400 mb-2">{active ? "Selected" : "Choose"}</p>
              <h3 className="relative text-2xl font-display text-cream-50">{l.name}</h3>
              <p className="relative font-display text-4xl font-bold text-gold-foil my-2">{l.price}</p>
              <p className="relative text-sm text-cream-300">{l.blurb}</p>
              <p className="relative mt-3 text-sm text-cream-100">
                Includes a {YEARS}-year RIHOSO membership
              </p>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="mt-10 space-y-5 panel-lux rounded-xl p-6 sm:p-8">
        <div>
          <label htmlFor="sp-name" className="block text-sm text-cream-200 mb-1">Full name</label>
          <input id="sp-name" name="name" type="text" autoComplete="name" required maxLength={120} className={inputClass} placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="sp-email" className="block text-sm text-cream-200 mb-1">Email</label>
          <input id="sp-email" name="email" type="email" autoComplete="email" required maxLength={200} className={inputClass} placeholder="you@example.com" />
          <p className="mt-1 text-xs text-cream-400">Your receipt and membership go to this address.</p>
        </div>
        <div>
          <label htmlFor="sp-phone" className="block text-sm text-cream-200 mb-1">
            Phone <span className="text-cream-400">(optional)</span>
          </label>
          <input id="sp-phone" name="phone" type="tel" autoComplete="tel" pattern="[0-9()+\-.\s]{7,}" title="Please enter a valid phone number" className={inputClass} placeholder="(401) 555-0123" />
        </div>
        <div>
          <label htmlFor="sp-recognize" className="block text-sm text-cream-200 mb-1">
            How should we thank you? <span className="text-cream-400">(optional)</span>
          </label>
          <input id="sp-recognize" name="recognizeAs" type="text" maxLength={120} className={inputClass} placeholder="Your name, your business, or “Anonymous”" />
        </div>

        {/* Honeypot for spam bots — hidden from people and screen readers */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input name="website" type="text" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <label className="flex items-start gap-3 text-sm text-cream-300 cursor-pointer">
          <input name="agree" type="checkbox" required className="mt-1 accent-gold-400" />
          <span>
            I agree to the{" "}
            <a href="/membership-terms" target="_blank" className="text-gold-400 hover:text-gold-300 underline">Membership and Event Terms</a>{" "}
            and the <a href="/terms" target="_blank" className="text-gold-400 hover:text-gold-300 underline">Terms of Use</a>. My{" "}
            {YEARS}-year membership starts today (or after my current one ends) and doesn&apos;t renew automatically.
          </span>
        </label>

        {error && (
          <p className="text-sm text-red-300 bg-red-900/30 border border-red-400/30 rounded px-4 py-3" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={sending} className="btn-gold w-full py-4 rounded font-semibold tracking-wide text-lg disabled:opacity-60">
          {sending ? "Opening secure payment…" : `Sponsor — ${selected.price}`}
        </button>
        <p className="text-center text-xs text-cream-400">Secure card payment by Stripe.</p>
      </form>
    </div>
  );
}
