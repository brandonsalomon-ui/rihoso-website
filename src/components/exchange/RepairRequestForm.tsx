"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { inputClass } from "./SignInForm";

export default function RepairRequestForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError("");
    const f = new FormData(e.currentTarget);
    const description = `Watch: ${f.get("watch")}\n\nWhat it needs: ${f.get("issue")}`;
    const res = await fetch("/api/marketplace/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "repair", description }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) setState("sent");
    else {
      setError(json.error || "Couldn't send the request.");
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div className="panel-lux rounded-xl p-8 text-center" role="status">
        <h2 className="text-2xl font-display text-cream-50 mb-2">Request received</h2>
        <p className="text-cream-300">RIHOSO will review it and email you a written quote. You can pay the quote online to book the repair.</p>
      </div>
    );
  }
  return (
    <form onSubmit={handleSubmit} className="panel-lux rounded-xl p-6 sm:p-8 space-y-5">
      <div>
        <label htmlFor="rp-watch" className="block text-sm text-cream-200 mb-1">Watch (brand, model, reference if known)</label>
        <input id="rp-watch" name="watch" required maxLength={200} className={inputClass} placeholder="e.g. Rolex Datejust 16234" />
      </div>
      <div>
        <label htmlFor="rp-issue" className="block text-sm text-cream-200 mb-1">What does it need?</label>
        <textarea id="rp-issue" name="issue" required minLength={10} maxLength={3000} rows={5} className={inputClass}
          placeholder="Running slow, needs a full service, crystal replacement, bracelet stretch…" />
      </div>
      {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
      <button disabled={state === "sending"} className="btn-gold w-full py-3 rounded font-semibold disabled:opacity-60">
        {state === "sending" ? "Sending…" : "Request a quote"}
      </button>
    </form>
  );
}
