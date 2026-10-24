"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import PageHero from "@/components/PageHero";
import LiveDial from "@/components/LiveDial";
import { Icon } from "@/components/ornaments";
import { EVENTS } from "@/lib/events";

const MEETING = EVENTS.find((e) => e.recurring);

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong.");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
    <PageHero
      eyebrow="Get in Touch"
      title="Contact Us"
      subtitle="Have a question about RIHOSO, our events, or membership? We'd love to hear from you."
    />
    <section className="py-20 sm:py-24 bg-forest-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.5fr_1fr] gap-10 items-start">
        <div className="panel-lux rounded-xl p-6 sm:p-10">

        {submitted ? (
          <div className="text-center bg-forest-800/60 border border-gold-400/30 rounded-lg p-8">
            <h2 className="text-2xl font-display text-cream-50 mb-2">Thank You!</h2>
            <p className="text-cream-300">
              Your message has been received. We&apos;ll get back to you as soon as possible.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm text-cream-200 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                autoComplete="name"
                required
                className="w-full bg-forest-950/60 border border-forest-600/50 rounded px-4 py-3 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60 transition-colors"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm text-cream-200 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                required
                className="w-full bg-forest-950/60 border border-forest-600/50 rounded px-4 py-3 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60 transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm text-cream-200 mb-1">
                Phone <span className="text-cream-400">(optional)</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                autoComplete="tel"
                className="w-full bg-forest-950/60 border border-forest-600/50 rounded px-4 py-3 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60 transition-colors"
                placeholder="(401) 555-0123"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm text-cream-200 mb-1">
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                className="w-full bg-forest-950/60 border border-forest-600/50 rounded px-4 py-3 text-cream-100 focus:outline-none focus:border-gold-400/60 transition-colors"
              >
                <option value="general">General Inquiry</option>
                <option value="membership">Membership Question</option>
                <option value="events">Events</option>
                <option value="sponsorship">Sponsorship</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm text-cream-200 mb-1">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                required
                className="w-full bg-forest-950/60 border border-forest-600/50 rounded px-4 py-3 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60 transition-colors resize-none"
                placeholder="Your message..."
              />
            </div>

            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Website
                <input name="website" type="text" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            {error && (
              <p className="text-sm text-red-300 bg-red-900/30 border border-red-400/30 rounded px-4 py-3" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="btn-gold w-full py-3 rounded font-semibold tracking-wide disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send Message"}
            </button>
          </form>
        )}

        </div>

        <aside className="space-y-6 lg:sticky lg:top-32">
          <div className="card-lux rounded-xl p-8 text-center">
            <LiveDial className="w-40 h-40 mx-auto text-gold-300" />
            {MEETING && (
              <>
                <p className="mt-5 text-xs uppercase tracking-[0.3em] text-gold-400">{MEETING.shortTitle ?? MEETING.title}</p>
                <p className="mt-2 font-display text-xl text-cream-50">{MEETING.date}</p>
                <p className="text-cream-300">
                  {MEETING.time} · {MEETING.location}
                </p>
              </>
            )}
            {!MEETING && (
              <p className="mt-5 text-xs uppercase tracking-[0.3em] text-gold-400">Now in Rhode Island</p>
            )}
          </div>
          <a
            href="mailto:info@rihoso.com"
            className="card-lux group rounded-xl p-6 flex items-center gap-4"
          >
            <span className="flex items-center justify-center w-12 h-12 rounded-full border border-gold-400/40 text-gold-400 group-hover:bg-gold-400 group-hover:text-forest-950 transition-colors">
              <Icon name="mail" className="w-6 h-6" />
            </span>
            <span>
              <span className="block text-xs uppercase tracking-[0.25em] text-cream-400">Email us directly</span>
              <span className="block font-display text-lg text-gold-300">info@rihoso.com</span>
            </span>
          </a>
        </aside>
      </div>
    </section>
    </>
  );
}
