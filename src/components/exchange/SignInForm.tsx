"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/browser";

export const inputClass =
  "w-full bg-forest-800 border border-forest-600/50 rounded px-4 py-3 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60 transition-colors";

export default function SignInForm({ next }: { next: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [verifying, setVerifying] = useState(false);

  async function handleCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = String(new FormData(e.currentTarget).get("code") ?? "").replace(/\D/g, "");
    if (token.length < 6) {
      setError("Please enter the 6-digit code from the email.");
      return;
    }
    setVerifying(true);
    setError("");
    const { error } = await createClient().auth.verifyOtp({ email, token, type: "email" });
    if (error) {
      setError("That code didn't work — it may have expired. Request a new email below.");
      setVerifying(false);
      return;
    }
    window.location.href = next;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const addr = String(form.get("email") ?? "").trim();
    setEmail(addr);
    // Implicit-flow client just for sending the link, so the link works in any browser
    // (the PKCE flow only works in the browser that requested it).
    const sender = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { error } = await sender.auth.signInWithOtp({
      email: addr,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
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
      <div className="panel-lux rounded-xl p-8 text-center space-y-5" role="status">
        <h2 className="text-2xl font-display text-cream-50">Check your email</h2>
        <p className="text-cream-300">
          We sent a sign-in email to <span className="text-cream-100">{email}</span>. Click the button in it, or
          type the 6-digit code from the email here:
        </p>
        <form onSubmit={handleCode} className="flex gap-3 max-w-xs mx-auto">
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            aria-label="Sign-in code"
            className={inputClass + " text-center tracking-[0.3em]"}
            placeholder="123456"
          />
          <button disabled={verifying} className="btn-gold px-5 rounded font-semibold disabled:opacity-60">
            {verifying ? "…" : "Sign in"}
          </button>
        </form>
        {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
        <button type="button" onClick={() => { setStatus("idle"); setError(""); }} className="text-sm text-gold-400 hover:text-gold-300">
          Use a different email or resend
        </button>
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
