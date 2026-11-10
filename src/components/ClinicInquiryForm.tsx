"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { trackTikTok } from "@/lib/tiktok";

const label = "block text-sm text-cream-200 mb-1";
const inputClass =
  "w-full bg-forest-950/60 border border-forest-600/50 rounded px-4 py-3 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60 transition-colors";

export default function ClinicInquiryForm() {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const body = {
      name: f.get("name"),
      email: f.get("email"),
      phone: f.get("phone"),
      notes: f.get("notes"),
      website: f.get("website"),
    };
    try {
      const res = await fetch("/api/clinic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Something went wrong.");
      setDone(true);
      trackTikTok("SubmitForm", { content_name: "Clinic inquiry" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="text-center bg-forest-800/60 border border-gold-400/30 rounded-lg p-8">
        <h3 className="text-2xl font-display text-cream-50 mb-2">Thank you!</h3>
        <p className="text-cream-300">We&apos;ve received your inquiry and will be in touch shortly to plan your clinic.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cl-name" className={label}>Name</label>
          <input id="cl-name" name="name" required maxLength={120} autoComplete="name" className={inputClass} />
        </div>
        <div>
          <label htmlFor="cl-phone" className={label}>Phone</label>
          <input id="cl-phone" name="phone" type="tel" required maxLength={40} autoComplete="tel" className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="cl-email" className={label}>Email</label>
        <input id="cl-email" name="email" type="email" required maxLength={200} autoComplete="email" className={inputClass} />
      </div>

      <div>
        <label htmlFor="cl-notes" className={label}>What are you looking to do?</label>
        <textarea
          id="cl-notes"
          name="notes"
          rows={5}
          maxLength={3000}
          className={inputClass + " resize-none"}
          placeholder="The occasion, roughly how many people, where you'd like to hold it, and any dates you have in mind. Giving a clinic as a gift? Tell us that too."
        />
      </div>

      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={sending}
        className="btn-gold w-full px-8 py-4 tracking-widest uppercase disabled:opacity-60"
      >
        {sending ? "Sending…" : "Send inquiry"}
      </button>
      <p className="text-xs text-cream-400 text-center">We&apos;ll reply by email or phone to plan the details.</p>
    </form>
  );
}
