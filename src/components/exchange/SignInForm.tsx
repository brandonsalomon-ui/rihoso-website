"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export const inputClass =
  "w-full bg-forest-800 border border-forest-600/50 rounded px-4 py-3 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60 transition-colors";

export default function SignInForm({ next }: { next: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const addr = String(form.get("email") ?? "").trim();
    setEmail(addr);
    const { error } = await createClient().auth.signInWithOtp({
      email: addr,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        data: name ? { display_name: name } : undefined,
      },
    });
    if (error) {
      setError(error.message || "Couldn't send the sign-in email. Please try again.");
      setStatus("idle");
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <div className="panel-lux rounded-xl p-8 text-center" role="status">
        <h2 className="text-2xl font-display text-cream-50 mb-2">Check your email</h2>
        <p className="text-cream-300">
          We sent a sign-in link to <span className="text-cream-100">{email}</span>. Open it on this device to continue.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="panel-lux rounded-xl p-6 sm:p-8 space-y-6">
      <div>
        <label htmlFor="si-name" className="block text-sm text-cream-200 mb-1">
          Name <span className="text-cream-400">(shown to buyers and sellers — first name and last initial is fine)</span>
        </label>
        <input id="si-name" name="name" type="text" autoComplete="name" maxLength={80} className={inputClass} placeholder="e.g. Brandon S." />
      </div>
      <div>
        <label htmlFor="si-email" className="block text-sm text-cream-200 mb-1">Email</label>
        <input id="si-email" name="email" type="email" autoComplete="email" required className={inputClass} placeholder="your@email.com" />
      </div>
      {error && (
        <p className="text-sm text-red-300 bg-red-900/30 border border-red-400/30 rounded px-4 py-3" role="alert">{error}</p>
      )}
      <button type="submit" disabled={status === "sending"} className="btn-gold w-full py-3 rounded font-semibold disabled:opacity-60">
        {status === "sending" ? "Sending…" : "Email me a sign-in link"}
      </button>
      <p className="text-xs text-cream-400 text-center">Your email is never shown to other members.</p>
    </form>
  );
}
