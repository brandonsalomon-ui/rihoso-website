"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { Icon } from "./ornaments";

const inputClass =
  "w-full bg-forest-900/70 border border-forest-600/50 rounded px-4 py-3 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60 transition-colors";

type Status = "idle" | "sending" | "sent" | "error";

/** RSVP button that opens a short form inside an event card. */
export default function EventRsvp({
  slug,
  closesLabel,
  closed,
  membersOnly,
}: {
  slug: string;
  /** e.g. "Friday, November 20" */
  closesLabel: string;
  closed: boolean;
  membersOnly: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [member, setMember] = useState<"" | "yes" | "no">("");
  const [sentTo, setSentTo] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/events/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(form.entries()), slug, guest: form.get("guest") === "on" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong.");
      setSentTo(String(form.get("email") ?? ""));
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (closed) {
    return (
      <p id={`rsvp-${slug}`} className="mt-6 text-sm text-cream-300">
        RSVPs are closed. Email <a href="mailto:info@rihoso.com" className="text-gold-400 hover:text-gold-300">info@rihoso.com</a> and
        we&apos;ll do our best to fit you in.
      </p>
    );
  }

  if (status === "sent") {
    return (
      <div id={`rsvp-${slug}`} className="mt-6 rounded-lg border border-gold-400/30 bg-forest-900/50 p-5" role="status">
        <p className="font-display text-xl text-cream-50">You&apos;re on the list.</p>
        <p className="mt-1 text-cream-300 text-sm">A confirmation is on its way{sentTo ? ` to ${sentTo}` : ""}. See you there.</p>
      </div>
    );
  }

  return (
    <div id={`rsvp-${slug}`} className="scroll-mt-28 mt-6">
      {!open ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-gold inline-flex items-center gap-2 px-7 py-3 tracking-widest uppercase text-sm"
          >
            RSVP
            <Icon name="arrow" className="w-4 h-4" />
          </button>
          <span className="text-sm text-cream-400">Please reply by {closesLabel}.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-gold-400/20 bg-forest-900/40 p-5 sm:p-6">
          <p className="font-display text-xl text-cream-50">RSVP <span className="text-sm text-cream-400 font-body">· by {closesLabel}</span></p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor={`${slug}-name`} className="block text-sm text-cream-200 mb-1">Full name</label>
              <input id={`${slug}-name`} name="name" type="text" autoComplete="name" required maxLength={120} className={inputClass} placeholder="Your name" />
            </div>
            <div>
              <label htmlFor={`${slug}-email`} className="block text-sm text-cream-200 mb-1">Email</label>
              <input id={`${slug}-email`} name="email" type="email" autoComplete="email" required maxLength={200} className={inputClass} placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor={`${slug}-phone`} className="block text-sm text-cream-200 mb-1">
                Phone <span className="text-cream-400">(optional)</span>
              </label>
              <input
                id={`${slug}-phone`}
                name="phone"
                type="tel"
                autoComplete="tel"
                pattern="[0-9()+\-.\s]{7,}"
                title="Please enter a valid phone number"
                className={inputClass}
                placeholder="(401) 555-0123"
              />
            </div>
          </div>

          <fieldset>
            <legend className="block text-sm text-cream-200 mb-2">Are you a RIHOSO member?</legend>
            <div className="grid grid-cols-2 gap-2 max-w-xs">
              {(["yes", "no"] as const).map((v) => (
                <label
                  key={v}
                  className={`cursor-pointer rounded border px-3 py-2.5 text-center text-sm transition-colors ${
                    member === v ? "border-gold-400 bg-gold-400/15 text-cream-50" : "border-forest-600/50 text-cream-300 hover:border-gold-400/40"
                  }`}
                >
                  <input type="radio" name="member" value={v} required checked={member === v} onChange={() => setMember(v)} className="sr-only" />
                  {v === "yes" ? "Yes" : "Not yet"}
                </label>
              ))}
            </div>
            {member === "no" && membersOnly && (
              <p className="mt-3 text-sm text-cream-300">
                This is a members&apos; evening.{" "}
                <Link href="/memberships#join" className="text-gold-400 hover:text-gold-300 underline">Join for $120 a year</Link>{" "}
                before the event. You can still RSVP now.
              </p>
            )}
          </fieldset>

          <label className="flex items-center gap-3 text-sm text-cream-200 cursor-pointer">
            <input name="guest" type="checkbox" className="accent-gold-400 w-4 h-4" />
            I&apos;m bringing a guest (+1)
          </label>

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

          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={status === "sending"} className="btn-gold px-8 py-3 rounded font-semibold tracking-wide disabled:opacity-60">
              {status === "sending" ? "Sending…" : "Send RSVP"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-cream-400 hover:text-cream-200">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
