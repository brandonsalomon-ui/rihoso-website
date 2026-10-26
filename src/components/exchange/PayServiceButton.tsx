"use client";

import { useState } from "react";

export default function PayServiceButton({ id, label }: { id: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function pay() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/marketplace/service-requests/${id}/pay`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.url) {
      setError(json.error || "Couldn't start checkout.");
      setBusy(false);
      return;
    }
    window.location.href = json.url;
  }
  return (
    <div>
      <button onClick={pay} disabled={busy} className="btn-gold px-8 py-3 rounded font-semibold disabled:opacity-60">
        {busy ? "Opening secure checkout…" : label}
      </button>
      {error && <p className="mt-2 text-sm text-red-300" role="alert">{error}</p>}
    </div>
  );
}
