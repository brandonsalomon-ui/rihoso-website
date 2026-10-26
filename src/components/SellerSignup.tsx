"use client";

import type { FormEvent } from "react";
import { useState } from "react";

const inputClass =
  "w-full bg-forest-800 border border-forest-600/50 rounded px-4 py-3 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60 transition-colors";

export default function SellerSignup({ resume = false }: { resume?: boolean }) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/marketplace/sellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) throw new Error(body.error || "Something went wrong.");
      window.location.href = body.url; // Stripe-hosted onboarding
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSending(false);
    }
  }

  if (resume) {
    return (
      <form onSubmit={handleSubmit} className="space-y-6 panel-lux rounded-xl p-6 sm:p-8 text-center">
        <h2 className="text-2xl font-display text-cream-50">Finish your seller setup</h2>
        <p className="text-sm text-cream-300">You&apos;ve started setting up payouts with Stripe. Pick up where you left off.</p>
        {error && (
          <p className="text-sm text-red-300 bg-red-900/30 border border-red-400/30 rounded px-4 py-3" role="alert">{error}</p>
        )}
        <button type="submit" disabled={sending} className="btn-gold w-full py-3 rounded font-semibold disabled:opacity-60">
          {sending ? "Connecting to Stripe…" : "Continue setup"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 panel-lux rounded-xl p-6 sm:p-8">
      <p className="text-sm text-cream-300 leading-relaxed">
        Next you&apos;ll be taken to our payment partner, Stripe, to confirm your identity and add the bank account
        where you&apos;ll be paid. RIHOSO never sees or stores those details.
      </p>

      <div>
        <label htmlFor="seller-name" className="block text-sm text-cream-200 mb-1">Full name</label>
        <input id="seller-name" name="name" type="text" autoComplete="name" required className={inputClass} placeholder="Your name" />
      </div>
      <div>
        <label htmlFor="seller-phone" className="block text-sm text-cream-200 mb-1">Phone</label>
        <input
          id="seller-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          pattern="[0-9()+\-.\s]{7,}"
          title="Please enter a valid phone number"
          className={inputClass}
          placeholder="(401) 555-0123"
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-cream-300 cursor-pointer">
        <input name="member" type="checkbox" className="mt-1 accent-gold-400" />
        <span>I paid my RIHOSO membership outside the website (5% selling fee instead of 10%). We&apos;ll confirm it. Members who join online get the 5% rate automatically.</span>
      </label>

      <label className="flex items-start gap-3 text-sm text-cream-300 cursor-pointer">
        <input name="agree" type="checkbox" required className="mt-1 accent-gold-400" />
        <span>
          I understand RIHOSO is a venue, not the seller. I&apos;m responsible for my listings and for shipping each watch
          as described, and RIHOSO&apos;s fee is deducted from each completed sale.
        </span>
      </label>

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

      <button type="submit" disabled={sending} className="btn-gold w-full py-3 rounded font-semibold disabled:opacity-60">
        {sending ? "Connecting to Stripe…" : "Continue to secure setup"}
      </button>
    </form>
  );
}
