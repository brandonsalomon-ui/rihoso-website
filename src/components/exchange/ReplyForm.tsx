"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReplyForm({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = String(new FormData(form).get("body") ?? "");
    setSending(true);
    setError("");
    const res = await fetch("/api/marketplace/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, body }),
    });
    const json = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      setError(json.error || "Couldn't send.");
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="panel-lux rounded-xl p-4 space-y-3">
      <textarea
        name="body"
        required
        maxLength={4000}
        rows={3}
        aria-label="Your reply"
        className="w-full bg-forest-800 border border-forest-600/50 rounded px-4 py-3 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60"
        placeholder="Write a reply…"
      />
      {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
      <button disabled={sending} className="btn-gold px-6 py-2 rounded font-semibold disabled:opacity-60">
        {sending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
