"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { MEMBERSHIP_TIERS, type TierId } from "@/lib/membership";
import { GuillocheRosette, Icon, type IconName } from "./ornaments";

const TIER_ICON: Record<string, IconName> = { member: "tradition" };

const inputClass =
  "w-full bg-forest-800 border border-forest-600/50 rounded px-4 py-3 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60 transition-colors";

type Status = "idle" | "sending" | "sent" | "error";

export default function MembershipSignup() {
  const [tier, setTier] = useState<TierId>(MEMBERSHIP_TIERS[0].id);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const formRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Allow links like /memberships?tier=family#join to preselect a tier.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("tier");
    if (fromUrl && MEMBERSHIP_TIERS.some((t) => t.id === fromUrl)) setTier(fromUrl as TierId);
  }, []);

  function chooseTier(id: TierId) {
    setTier(id);
    if (status === "sent") setStatus("idle");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 500);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(form.entries()), tier }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong.");
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  const selected = MEMBERSHIP_TIERS.find((t) => t.id === tier)!;

  return (
    <>
      <div className={MEMBERSHIP_TIERS.length > 1 ? "grid grid-cols-1 md:grid-cols-3 gap-6" : "max-w-md mx-auto"}>
        {MEMBERSHIP_TIERS.map((t) => {
          const isSelected = t.id === tier;
          return (
            <div
              key={t.id}
              data-active={t.highlighted}
              className={`card-lux group flex flex-col rounded-xl p-8 overflow-hidden ${t.highlighted && MEMBERSHIP_TIERS.length > 1 ? "md:-mt-4 md:pb-12" : ""}`}
            >
              <div className="pointer-events-none absolute -right-16 -top-16 text-gold-400/[0.08]">
                <GuillocheRosette className="w-56 h-56 group-hover:animate-rotate-medium" />
              </div>
              {t.highlighted && MEMBERSHIP_TIERS.length > 1 && (
                <p className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-br from-gold-300 via-gold-400 to-gold-500 text-forest-950 whitespace-nowrap text-[11px] uppercase tracking-[0.25em] font-semibold px-4 py-1 rounded-b-md">
                  Most Popular
                </p>
              )}
              <span className={`relative flex items-center justify-center w-14 h-14 rounded-full border mb-5 ${t.highlighted ? "border-gold-300 text-gold-200 bg-gold-400/10" : "border-gold-400/40 text-gold-400"}`}>
                <Icon name={TIER_ICON[t.id]} className="w-7 h-7" />
              </span>
              <h3 className="relative text-2xl font-display text-cream-50 mb-1">{t.name}</h3>
              <div className="relative mb-6">
                <span className="font-display text-4xl font-bold text-gold-foil">{t.price}</span>
                <span className="text-cream-400 text-sm ml-1">/{t.period}</span>
              </div>
              <ul className="relative space-y-3 mb-8 flex-1">
                {t.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-cream-300">
                    <svg className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => chooseTier(t.id)}
                aria-pressed={isSelected}
                className={`w-full py-3 rounded font-semibold transition-colors ${
                  t.highlighted
                    ? "btn-gold"
                    : "border border-cream-200/30 text-cream-100 hover:border-gold-400 hover:text-gold-200 hover:bg-gold-400/5"
                }`}
              >
                {MEMBERSHIP_TIERS.length > 1 ? `Join as ${t.name}` : "Join RIHOSO"}
              </button>
            </div>
          );
        })}
      </div>

      <div id="join" ref={formRef} className="scroll-mt-28 mt-20 max-w-xl mx-auto">
        <p className="text-gold-400 text-sm uppercase tracking-[0.2em] mb-2 text-center">Sign Up</p>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-cream-50 mb-3 text-center">
          Become a Member
        </h2>
        <p className="text-center text-cream-300 mb-10">
          Fill in your details and we&apos;ll be in touch to welcome you and arrange your membership dues.
        </p>

        {status === "sent" ? (
          <div className="text-center bg-forest-800/60 border border-gold-400/30 rounded-lg p-8" role="status">
            <h3 className="text-2xl font-display text-cream-50 mb-2">Thank you!</h3>
            <p className="text-cream-300">
              We&apos;ve received your membership sign-up. A member of RIHOSO will contact you
              shortly with next steps.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 panel-lux rounded-xl p-6 sm:p-8">
            {MEMBERSHIP_TIERS.length > 1 && (
            <fieldset>
              <legend className="block text-sm text-cream-200 mb-2">Membership type</legend>
              <div className="grid grid-cols-3 gap-2">
                {MEMBERSHIP_TIERS.map((t) => (
                  <label
                    key={t.id}
                    className={`cursor-pointer rounded border px-3 py-3 text-center text-sm transition-colors ${
                      tier === t.id
                        ? "border-gold-400 bg-gold-400/15 text-cream-50"
                        : "border-forest-600/50 text-cream-300 hover:border-gold-400/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tier-choice"
                      value={t.id}
                      checked={tier === t.id}
                      onChange={() => setTier(t.id)}
                      className="sr-only"
                    />
                    <span className="block font-semibold">{t.name}</span>
                    <span className="block text-xs text-cream-400">
                      {t.price} {t.period}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            )}

            <div>
              <label htmlFor="join-name" className="block text-sm text-cream-200 mb-1">
                Full name
              </label>
              <input ref={nameRef} id="join-name" name="name" type="text" autoComplete="name" required className={inputClass} placeholder="Your name" />
            </div>

            <div>
              <label htmlFor="join-email" className="block text-sm text-cream-200 mb-1">
                Email
              </label>
              <input id="join-email" name="email" type="email" autoComplete="email" required className={inputClass} placeholder="your@email.com" />
            </div>

            <div>
              <label htmlFor="join-phone" className="block text-sm text-cream-200 mb-1">
                Phone
              </label>
              <input
                id="join-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                pattern="[0-9()+\-.\s]{7,}"
                title="Please enter a valid phone number"
                className={inputClass}
                placeholder="(401) 555-0123"
              />
            </div>

            {/* Honeypot for spam bots — hidden from people and screen readers */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Website
                <input name="website" type="text" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            {status === "error" && (
              <p className="text-sm text-red-300 bg-red-900/30 border border-red-400/30 rounded px-4 py-3" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="btn-gold w-full py-3 rounded font-semibold tracking-wide disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : MEMBERSHIP_TIERS.length > 1 ? `Join as ${selected.name} — ${selected.price}/yr` : `Join RIHOSO — ${selected.price}/yr`}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
