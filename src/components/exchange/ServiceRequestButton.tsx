"use client";

import { useState } from "react";

export default function ServiceRequestButton({
  type,
  listingId,
  label,
}: {
  type: "validation" | "repair";
  listingId?: string;
  label: string;
}) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function request() {
    setState("sending");
    const res = await fetch("/api/marketplace/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, listingId }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.url) {
      window.location.href = json.url; // secure Stripe checkout
      return;
    }
    if (res.ok) {
      setState("done");
      setMessage("Request received — RIHOSO will email you.");
    } else {
      setState("error");
      setMessage(json.error || "Couldn't send the request. Please try again.");
    }
  }

  if (state === "done") return <p className="text-sm text-gold-300" role="status">{message}</p>;
  return (
    <div>
      <button
        type="button"
        onClick={request}
        disabled={state === "sending"}
        className="w-full px-5 py-3 rounded border border-gold-400/40 text-gold-200 hover:bg-gold-400/10 text-sm disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : label}
      </button>
      {state === "error" && <p className="mt-2 text-sm text-red-300" role="alert">{message}</p>}
    </div>
  );
}
