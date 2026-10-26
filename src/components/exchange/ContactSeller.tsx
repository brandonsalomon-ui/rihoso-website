"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ContactSeller({ listingId, conversationId }: { listingId: string; conversationId: string | null }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  if (conversationId) {
    return (
      <Link href={`/marketplace/messages/${conversationId}`} className="btn-gold block text-center py-3 rounded font-semibold">
        View your conversation with the seller
      </Link>
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError("");
    const body = String(new FormData(e.currentTarget).get("body") ?? "");
    try {
      const res = await fetch("/api/marketplace/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, body }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Couldn't send your message.");
      router.push(`/marketplace/messages/${json.conversationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send your message.");
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel-lux rounded-xl p-5 space-y-3">
      <label htmlFor="msg" className="block text-sm text-cream-200">Message the seller</label>
      <textarea
        id="msg"
        name="body"
        required
        maxLength={4000}
        rows={4}
        className="w-full bg-forest-800 border border-forest-600/50 rounded px-4 py-3 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60"
        placeholder="Ask about condition, service history, or make an offer…"
      />
      {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
      <button disabled={sending} className="btn-gold w-full py-3 rounded font-semibold disabled:opacity-60">
        {sending ? "Sending…" : "Send message"}
      </button>
      <p className="text-xs text-cream-400">Your email isn&apos;t shared. Replies arrive in your RIHOSO messages and by email.</p>
    </form>
  );
}
