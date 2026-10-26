"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** A button that posts one admin action, with optional confirm text and a note prompt. */
export default function AdminButton({
  label,
  body,
  confirmText,
  promptText,
  variant = "plain",
}: {
  label: string;
  body: Record<string, unknown>;
  confirmText?: string;
  promptText?: string;
  variant?: "plain" | "gold" | "danger";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (confirmText && !confirm(confirmText)) return;
    let note: string | null = null;
    if (promptText) {
      note = prompt(promptText);
      if (note === null) return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/marketplace/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, ...(note !== null ? { note, notes: note } : {}) }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setError(json.error || "Failed");
    else router.refresh();
  }

  const cls =
    variant === "gold"
      ? "btn-gold"
      : variant === "danger"
        ? "border border-red-300/40 text-red-200 hover:bg-red-900/20"
        : "border border-cream-200/30 text-cream-100 hover:border-gold-400";
  return (
    <span className="inline-flex flex-col">
      <button onClick={run} disabled={busy} className={`${cls} px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-60`}>
        {busy ? "…" : label}
      </button>
      {error && <span className="text-xs text-red-300 mt-1">{error}</span>}
    </span>
  );
}
