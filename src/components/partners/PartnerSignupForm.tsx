"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { inputClass } from "@/components/exchange/SignInForm";

type Initial = {
  businessName?: string;
  contactName?: string;
  phone?: string;
  website?: string;
  city?: string;
  address?: string;
  blurb?: string;
};

const label = "block text-sm text-cream-200 mb-1";

/** Workshop details + partner terms, then on to Stripe for the annual sponsorship. */
export default function PartnerSignupForm({ initial, buttonLabel }: { initial?: Initial; buttonLabel: string }) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/repair-partners/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: f.get("businessName"),
          contactName: f.get("contactName"),
          phone: f.get("phone"),
          website: f.get("website"),
          city: f.get("city"),
          address: f.get("address"),
          blurb: f.get("blurb"),
          accept: f.get("agree") === "on",
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) throw new Error(body.error || "Something went wrong. Please try again.");
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel-lux rounded-xl p-6 sm:p-8 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={label} htmlFor="rp-biz">Workshop / business name</label>
          <input id="rp-biz" name="businessName" required minLength={2} maxLength={120} defaultValue={initial?.businessName} className={inputClass} />
        </div>
        <div>
          <label className={label} htmlFor="rp-contact">Your name</label>
          <input id="rp-contact" name="contactName" required maxLength={120} autoComplete="name" defaultValue={initial?.contactName} className={inputClass} />
        </div>
        <div>
          <label className={label} htmlFor="rp-phone">Business phone <span className="text-cream-400">(private — for RIHOSO only)</span></label>
          <input id="rp-phone" name="phone" type="tel" required maxLength={40} autoComplete="tel" defaultValue={initial?.phone} className={inputClass} placeholder="(401) 555-0123" />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="rp-address">Shop address <span className="text-cream-400">(private — for RIHOSO only)</span></label>
          <input id="rp-address" name="address" maxLength={200} autoComplete="street-address" defaultValue={initial?.address} className={inputClass} />
        </div>
        <div>
          <label className={label} htmlFor="rp-city">City / town <span className="text-cream-400">(shown to customers)</span></label>
          <input id="rp-city" name="city" required maxLength={80} defaultValue={initial?.city} className={inputClass} placeholder="Providence, RI" />
        </div>
        <div>
          <label className={label} htmlFor="rp-web">Website <span className="text-cream-400">(optional, private)</span></label>
          <input id="rp-web" name="website" maxLength={200} defaultValue={initial?.website} className={inputClass} placeholder="example.com" />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="rp-blurb">About your workshop <span className="text-cream-400">(shown to customers)</span></label>
          <textarea id="rp-blurb" name="blurb" maxLength={600} rows={4} defaultValue={initial?.blurb} className={inputClass}
            placeholder="Family-owned since 1952. Full movement servicing, vintage restoration, crystals, pressure testing…" />
        </div>
      </div>

      <label className="flex items-start gap-3 text-sm text-cream-300 cursor-pointer">
        <input name="agree" type="checkbox" required className="mt-1 accent-gold-400" />
        <span>I agree to the Repair Partner terms above, including RIHOSO&apos;s referral fee on each job I&apos;m chosen for.</span>
      </label>

      {error && <p className="text-sm text-red-300 bg-red-900/30 border border-red-400/30 rounded px-4 py-3" role="alert">{error}</p>}

      <button type="submit" disabled={sending} className="btn-gold w-full py-3 rounded font-semibold disabled:opacity-60">
        {sending ? "Opening secure payment…" : buttonLabel}
      </button>
    </form>
  );
}
