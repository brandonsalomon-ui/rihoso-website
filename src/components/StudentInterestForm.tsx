"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIMES = ["After school (3–5 pm)", "Early evening (5–7 pm)", "Evening (7–9 pm)", "Weekend daytime"];
const YEARS = ["Grade 9", "Grade 10", "Grade 11", "Grade 12", "College", "Other"];

type Role = "guardian" | "student" | "educator";

const ROLE_LABELS: { id: Role; label: string }[] = [
  { id: "guardian", label: "Parent or guardian" },
  { id: "student", label: "Student, 13 or older" },
  { id: "educator", label: "Teacher or school staff" },
];

const label = "block text-sm text-cream-200 mb-1";
const inputClass =
  "w-full bg-forest-950/60 border border-forest-600/50 rounded px-4 py-3 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60 transition-colors";

export default function StudentInterestForm() {
  const [role, setRole] = useState<Role>("guardian");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const body = {
      role,
      name: f.get("name"),
      email: f.get("email"),
      phone: f.get("phone"),
      studentName: f.get("studentName"),
      school: f.get("school"),
      year: f.get("year"),
      guardianName: f.get("guardianName"),
      guardianEmail: f.get("guardianEmail"),
      days: f.getAll("days"),
      time: f.get("time"),
      message: f.get("message"),
      age13: f.get("age13") === "on",
      website: f.get("website"),
    };
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Something went wrong.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="text-center bg-forest-800/60 border border-gold-400/30 rounded-lg p-8">
        <h3 className="text-2xl font-display text-cream-50 mb-2">Thank you!</h3>
        <p className="text-cream-300">
          We&apos;ve received your interest and will be in touch by email.
          {role === "student" ? " We'll contact your parent or guardian before you take part." : ""}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <fieldset>
        <legend className={label}>I am a…</legend>
        <div className="grid sm:grid-cols-3 gap-2">
          {ROLE_LABELS.map((r) => (
            <label
              key={r.id}
              className={`cursor-pointer rounded border px-3 py-2.5 text-sm text-center transition-colors ${
                role === r.id ? "border-gold-400 bg-gold-400/10 text-gold-200" : "border-forest-600/50 text-cream-300 hover:border-gold-400/50"
              }`}
            >
              <input type="radio" name="role" value={r.id} checked={role === r.id} onChange={() => setRole(r.id)} className="sr-only" />
              {r.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="st-name" className={label}>
            {role === "student" ? "Your first and last name" : "Your name"}
          </label>
          <input id="st-name" name="name" required maxLength={120} autoComplete="name" className={inputClass} />
        </div>
        <div>
          <label htmlFor="st-email" className={label}>Your email</label>
          <input id="st-email" name="email" type="email" required maxLength={200} autoComplete="email" className={inputClass} />
        </div>
      </div>

      {role === "guardian" && (
        <div>
          <label htmlFor="st-student" className={label}>Student&apos;s first name</label>
          <input id="st-student" name="studentName" required maxLength={120} className={inputClass} />
        </div>
      )}

      <div className="grid sm:grid-cols-[1.6fr_1fr] gap-4">
        <div>
          <label htmlFor="st-school" className={label}>School</label>
          <input id="st-school" name="school" required maxLength={160} className={inputClass} placeholder="e.g. a Rhode Island high school or college" />
        </div>
        {role !== "educator" && (
          <div>
            <label htmlFor="st-year" className={label}>School year</label>
            <select id="st-year" name="year" className={inputClass} defaultValue="">
              <option value="" disabled>Choose…</option>
              {YEARS.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {role === "student" && (
        <div className="rounded-lg border border-gold-400/25 bg-forest-950/40 p-4 space-y-4">
          <p className="text-sm text-cream-300">
            We contact a parent or guardian before any student takes part. Please add theirs.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="st-gname" className={label}>Parent or guardian&apos;s name</label>
              <input id="st-gname" name="guardianName" required maxLength={120} className={inputClass} />
            </div>
            <div>
              <label htmlFor="st-gemail" className={label}>Parent or guardian&apos;s email</label>
              <input id="st-gemail" name="guardianEmail" type="email" required maxLength={200} className={inputClass} />
            </div>
          </div>
          <label className="flex items-start gap-3 text-sm text-cream-200">
            <input type="checkbox" name="age13" required className="mt-1 accent-[#c9a84c]" />
            I am 13 or older. (Under 13? Please ask a parent or guardian to fill in this form.)
          </label>
        </div>
      )}

      <div>
        <label htmlFor="st-phone" className={label}>
          Phone <span className="text-cream-400">(optional)</span>
        </label>
        <input id="st-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" className={inputClass} />
      </div>

      <fieldset>
        <legend className={label}>Best days to meet</legend>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <label key={d} className="inline-flex items-center gap-2 rounded border border-forest-600/50 px-3 py-1.5 text-sm text-cream-300 has-[:checked]:border-gold-400 has-[:checked]:text-gold-200">
              <input type="checkbox" name="days" value={d} className="accent-[#c9a84c]" />
              {d.slice(0, 3)}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="st-time" className={label}>Best time</label>
        <select id="st-time" name="time" className={inputClass} defaultValue="">
          <option value="">No preference</option>
          {TIMES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="st-msg" className={label}>
          {role === "educator" ? "Tell us about your school or club" : "What interests you about watches?"}{" "}
          <span className="text-cream-400">(optional)</span>
        </label>
        <textarea id="st-msg" name="message" rows={4} maxLength={3000} className={inputClass + " resize-none"} />
      </div>

      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <p className="text-xs text-cream-400 leading-relaxed">
        We use these details only to reply and arrange participation; they&apos;re sent to RIHOSO by email and not shared
        beyond the providers named in our <Link href="/privacy" className="underline hover:text-gold-300">Privacy Policy</Link>.
        We don&apos;t ask for dates of birth.
      </p>

      {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
      <button disabled={sending} className="btn-gold w-full px-8 py-4 tracking-widest uppercase disabled:opacity-60">
        {sending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
