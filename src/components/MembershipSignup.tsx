"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { MEMBERSHIP_TIERS, type TierId } from "@/lib/membership";
import { POLICIES } from "@/lib/policies";
import { trackTikTok } from "@/lib/tiktok";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/browser";
import { GuillocheRosette, Icon, type IconName } from "./ornaments";

const TIER_ICON: Record<string, IconName> = { member: "tradition" };

const inputClass =
  "w-full bg-forest-800 border border-forest-600/50 rounded px-4 py-3 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60 transition-colors";

type Status = "idle" | "sending" | "sent" | "error";

/** Name and phone kept for the few minutes it takes to confirm an email, so nobody retypes them. */
const DRAFT_KEY = "rihoso-join-draft";
type Draft = { name: string; phone: string };

function readDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}
function saveDraft(d: Draft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {}
}
function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {}
}

export default function MembershipSignup() {
  const [tier, setTier] = useState<TierId>(MEMBERSHIP_TIERS[0].id);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const formRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  // undefined = still checking; null = not signed in; string = the signed-in email.
  const [account, setAccount] = useState<string | null | undefined>(undefined);
  const [draft, setDraft] = useState<Draft>({ name: "", phone: "" });
  const [codeFor, setCodeFor] = useState(""); // email a confirmation code was sent to
  const [verifying, setVerifying] = useState(false);

  // Allow links like /memberships?tier=family#join to preselect a tier.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("tier");
    if (fromUrl && MEMBERSHIP_TIERS.some((t) => t.id === fromUrl)) setTier(fromUrl as TierId);
    const saved = readDraft();
    if (saved) setDraft(saved);
    createClient()
      .auth.getUser()
      .then((res: { data: { user: { email?: string } | null } }) => setAccount(res.data.user?.email ?? null))
      .catch(() => setAccount(null));
  }, []);

  async function startCheckout(d: Draft) {
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/membership/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: d.name, phone: d.phone, tier, accept: true }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setAccount(null);
        throw new Error("Please confirm your email to continue.");
      }
      if (!res.ok || !body.url) throw new Error(body.error || "Something went wrong.");
      clearDraft();
      trackTikTok("InitiateCheckout", { content_name: "RIHOSO Membership", content_type: "product", currency: "USD" });
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  async function sendCode(email: string, d: Draft) {
    setStatus("sending");
    setError("");
    saveDraft(d);
    // Implicit-flow client just for sending, so the emailed link also works in another browser.
    const sender = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { error } = await sender.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent("/memberships#join")}`,
        data: {
          display_name: d.name,
          terms_version: POLICIES.terms.version,
          privacy_version: POLICIES.privacy.version,
        },
      },
    });
    if (error) {
      setError(error.message || "Couldn't send the confirmation email. Please try again.");
      setStatus("error");
      return;
    }
    setCodeFor(email);
    setStatus("idle");
  }

  async function handleCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = String(new FormData(e.currentTarget).get("code") ?? "").replace(/\D/g, "");
    if (token.length < 6) {
      setError("Please enter the 6-digit code from the email.");
      return;
    }
    setVerifying(true);
    setError("");
    const { error } = await createClient().auth.verifyOtp({ email: codeFor, token, type: "email" });
    setVerifying(false);
    if (error) {
      setError("That code didn't work — it may have expired. Use “Send a new code” below.");
      return;
    }
    setAccount(codeFor);
    setCodeFor("");
    await startCheckout(draft);
  }

  function chooseTier(id: TierId) {
    setTier(id);
    if (status === "sent") setStatus("idle");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 500);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (String(form.get("website") ?? "")) return; // honeypot
    const d: Draft = { name: String(form.get("name") ?? "").trim(), phone: String(form.get("phone") ?? "").trim() };
    setDraft(d);
    if (account) {
      await startCheckout(d);
    } else {
      await sendCode(String(form.get("email") ?? "").trim(), d);
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
                <span className="text-cream-400 text-sm ml-1">{t.period}</span>
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
          Pay {selected.price} securely by card. Your membership starts right away, lasts 12 months and doesn&apos;t
          renew automatically. We&apos;ll email you a 6-digit code to confirm your address before payment.
        </p>

        {status === "sent" ? (
          <div className="text-center bg-forest-800/60 border border-gold-400/30 rounded-lg p-8" role="status">
            <h3 className="text-2xl font-display text-cream-50 mb-2">Thank you!</h3>
            <p className="text-cream-300">
              We&apos;ve received your membership sign-up. A member of RIHOSO will contact you
              shortly with next steps.
            </p>
          </div>
        ) : codeFor ? (
          <form onSubmit={handleCode} className="space-y-6 panel-lux rounded-xl p-6 sm:p-8 text-center">
            <h3 className="text-2xl font-display text-cream-50">Check your email</h3>
            <p className="text-cream-300">
              We sent a 6-digit code to <span className="text-cream-100">{codeFor}</span>. Enter it here to continue to
              payment.
            </p>
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              required
              autoFocus
              className={inputClass + " text-center text-2xl tracking-[0.5em]"}
              placeholder="••••••"
            />
            {error && (
              <p className="text-sm text-red-300 bg-red-900/30 border border-red-400/30 rounded px-4 py-3" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={verifying || status === "sending"}
              className="btn-gold w-full py-3 rounded font-semibold tracking-wide disabled:opacity-60"
            >
              {verifying ? "Checking…" : status === "sending" ? "Opening secure payment…" : `Confirm and pay — ${selected.price}`}
            </button>
            <p className="text-sm text-cream-400">
              No email? Check spam, or{" "}
              <button
                type="button"
                onClick={() => sendCode(codeFor, draft)}
                className="text-gold-400 hover:text-gold-300 underline"
              >
                send a new code
              </button>{" "}
              ·{" "}
              <button
                type="button"
                onClick={() => {
                  setCodeFor("");
                  setError("");
                }}
                className="text-gold-400 hover:text-gold-300 underline"
              >
                use a different email
              </button>
            </p>
          </form>
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
              <input
                ref={nameRef}
                id="join-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                maxLength={120}
                defaultValue={draft.name}
                key={`name-${draft.name}`}
                className={inputClass}
                placeholder="Your name"
              />
            </div>

            {account ? (
              <p className="text-sm text-cream-300 bg-forest-800/60 border border-gold-400/20 rounded px-4 py-3">
                Signed in as <span className="text-cream-100">{account}</span>. Your membership will be linked to this email.
              </p>
            ) : (
              <div>
                <label htmlFor="join-email" className="block text-sm text-cream-200 mb-1">
                  Email
                </label>
                <input
                  id="join-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={200}
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>
            )}

            <div>
              <label htmlFor="join-phone" className="block text-sm text-cream-200 mb-1">
                Phone <span className="text-cream-400">(optional)</span>
              </label>
              <input
                id="join-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                pattern="[0-9()+\-.\s]{7,}"
                title="Please enter a valid phone number"
                defaultValue={draft.phone}
                key={`phone-${draft.phone}`}
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

            <label className="flex items-start gap-3 text-sm text-cream-300 cursor-pointer">
              <input name="agree" type="checkbox" required className="mt-1 accent-gold-400" />
              <span>
                I agree to the{" "}
                <a href="/membership-terms" target="_blank" className="text-gold-400 hover:text-gold-300 underline">Membership and Event Terms</a>{" "}
                and the <a href="/terms" target="_blank" className="text-gold-400 hover:text-gold-300 underline">Terms of Use</a>.{" "}
                {selected.price} for 12 months; no automatic renewal. Full refund within 14 days if no member benefit has been used.
              </span>
            </label>

            {status === "error" && (
              <p className="text-sm text-red-300 bg-red-900/30 border border-red-400/30 rounded px-4 py-3" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "sending" || account === undefined}
              className="btn-gold w-full py-3 rounded font-semibold tracking-wide disabled:opacity-60"
            >
              {status === "sending"
                ? account
                  ? "Opening secure payment…"
                  : "Sending code…"
                : account === null
                  ? "Email me a code to continue"
                  : `Continue to payment — ${selected.price}`}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
