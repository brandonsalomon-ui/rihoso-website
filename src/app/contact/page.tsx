"use client";

import type { FormEvent } from "react";
import { useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="py-20 bg-forest-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-gold-400 text-sm uppercase tracking-[0.2em] mb-2 text-center">
          Get in Touch
        </p>
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-cream-50 mb-4 text-center">
          Contact Us
        </h1>
        <p className="text-center text-cream-300 mb-12">
          Have a question about RIHOSO, our events, or membership? We&apos;d love to hear from you.
        </p>

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
                required
                className="w-full bg-forest-800 border border-forest-600/50 rounded px-4 py-3 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60 transition-colors"
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
                required
                className="w-full bg-forest-800 border border-forest-600/50 rounded px-4 py-3 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60 transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm text-cream-200 mb-1">
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                className="w-full bg-forest-800 border border-forest-600/50 rounded px-4 py-3 text-cream-100 focus:outline-none focus:border-gold-400/60 transition-colors"
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
                className="w-full bg-forest-800 border border-forest-600/50 rounded px-4 py-3 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60 transition-colors resize-none"
                placeholder="Your message..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gold-400 text-forest-950 py-3 rounded font-semibold hover:bg-gold-300 transition-colors"
            >
              Send Message
            </button>
          </form>
        )}

        <div className="mt-12 text-center text-cream-400 text-sm">
          <p>Or reach us directly at{" "}
            <a href="mailto:info@rihoso.com" className="text-gold-400 hover:text-gold-300 transition-colors">
              info@rihoso.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
