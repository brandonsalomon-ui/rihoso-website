"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass } from "@/components/exchange/SignInForm";

const label = "block text-sm text-cream-200 mb-1";

/** Admin: add a workshop as a repair partner without payment (e.g. founding partners). */
export default function AddPartnerForm({ defaultThrough }: { defaultThrough: string }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setSending(true);
    setError("");
    setDone("");
    try {
      const res = await fetch("/api/marketplace/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: f.get("businessName"),
          contactName: f.get("contactName"),
          email: f.get("email"),
          phone: f.get("phone"),
          website: f.get("website"),
          city: f.get("city"),
          address: f.get("address"),
          blurb: f.get("blurb"),
          through: f.get("through"),
          sendWelcome: f.get("sendWelcome") === "on",
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong. Please try again.");
      setDone(
        `${f.get("businessName")} is now an active partner.${body.emailed ? ` Welcome email sent to ${f.get("email")}.` : f.get("sendWelcome") === "on" ? " The welcome email didn't send. They can still sign in at rihoso.com/partner." : ""}`
      );
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <details className="mt-6 rounded-lg border border-forest-600/40 p-4">
      <summary className="cursor-pointer text-gold-300">Add a partner (complimentary)</summary>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <p className="text-sm text-cream-400">
          The workshop goes live right away, free until the date below. Their email is how they sign in to the partner dashboard. After that date they renew at the normal price. Customers see only the business name, city and the description; phone, address, website and email stay private to RIHOSO.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={label} htmlFor="ap-biz">Workshop / business name</label>
            <input id="ap-biz" name="businessName" required minLength={2} maxLength={120} className={inputClass} />
          </div>
          <div>
            <label className={label} htmlFor="ap-contact">Contact name</label>
            <input id="ap-contact" name="contactName" required maxLength={120} className={inputClass} />
          </div>
          <div>
            <label className={label} htmlFor="ap-email">Email <span className="text-cream-400">(their sign-in)</span></label>
            <input id="ap-email" name="email" type="email" required maxLength={200} className={inputClass} />
          </div>
          <div>
            <label className={label} htmlFor="ap-phone">Phone <span className="text-cream-400">(private)</span></label>
            <input id="ap-phone" name="phone" type="tel" maxLength={40} className={inputClass} />
          </div>
          <div>
            <label className={label} htmlFor="ap-city">City / town <span className="text-cream-400">(shown)</span></label>
            <input id="ap-city" name="city" maxLength={80} className={inputClass} placeholder="Cranston, RI" />
          </div>
          <div>
            <label className={label} htmlFor="ap-address">Shop address <span className="text-cream-400">(private)</span></label>
            <input id="ap-address" name="address" maxLength={200} className={inputClass} />
          </div>
          <div>
            <label className={label} htmlFor="ap-web">Website <span className="text-cream-400">(private)</span></label>
            <input id="ap-web" name="website" maxLength={200} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="ap-blurb">About the workshop <span className="text-cream-400">(shown to customers)</span></label>
            <textarea id="ap-blurb" name="blurb" maxLength={600} rows={3} className={inputClass} />
          </div>
          <div>
            <label className={label} htmlFor="ap-through">Free through</label>
            <input id="ap-through" name="through" type="date" required defaultValue={defaultThrough} className={inputClass} />
          </div>
          <label className="flex items-center gap-3 text-sm text-cream-300 cursor-pointer sm:mt-6">
            <input name="sendWelcome" type="checkbox" defaultChecked className="accent-gold-400" />
            <span>Email them a welcome with sign-in instructions</span>
          </label>
        </div>
        {error && <p className="text-sm text-red-300 bg-red-900/30 border border-red-400/30 rounded px-4 py-3" role="alert">{error}</p>}
        {done && <p className="text-sm text-green-300 bg-green-900/20 border border-green-400/30 rounded px-4 py-3" role="status">{done}</p>}
        <button type="submit" disabled={sending} className="btn-gold px-6 py-2 rounded font-semibold disabled:opacity-60">
          {sending ? "Adding…" : "Add partner"}
        </button>
      </form>
    </details>
  );
}
