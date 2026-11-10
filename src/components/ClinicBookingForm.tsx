"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { CLINIC_PRICE, dollars, OCCASIONS, priceGuests, TBD } from "@/lib/clinic";
import { trackTikTok } from "@/lib/tiktok";

const label = "block text-sm text-cream-200 mb-1";
const inputClass =
  "w-full bg-forest-950/60 border border-forest-600/50 rounded px-4 py-3 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60 transition-colors";
const smallBtn =
  "px-4 py-2 rounded border border-gold-400/50 text-gold-300 text-sm hover:bg-gold-400 hover:text-forest-950 transition-colors disabled:opacity-50 disabled:pointer-events-none";

type Guest = {
  key: number;
  name: string;
  member: boolean;
  memberEmail: string;
  codeId: string;
  code: string;
  verified: boolean;
  busy: boolean;
  message: string;
};

let nextKey = 1;
function blankGuest(): Guest {
  return { key: nextKey++, name: "", member: false, memberEmail: "", codeId: "", code: "", verified: false, busy: false, message: "" };
}

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Something went wrong.");
  return json;
}

export default function ClinicBookingForm() {
  const [guests, setGuests] = useState<Guest[]>(() => Array.from({ length: CLINIC_PRICE.minimumSeats }, blankGuest));
  const [occasion, setOccasion] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Only verified members get the member rate in the running total, same as on the server.
  const price = useMemo(() => priceGuests(guests.map((g) => ({ member: g.member && g.verified }))), [guests]);
  const unverified = guests.filter((g) => g.member && !g.verified).length;

  function update(key: number, patch: Partial<Guest>) {
    setGuests((list) => list.map((g) => (g.key === key ? { ...g, ...patch } : g)));
  }

  function addGuest() {
    setGuests((list) => (list.length >= CLINIC_PRICE.maximumSeats ? list : [...list, blankGuest()]));
  }

  function removeGuest(key: number) {
    setGuests((list) => (list.length > CLINIC_PRICE.minimumSeats ? list.filter((g) => g.key !== key) : list.map((g) => (g.key === key ? { ...blankGuest(), key } : g))));
  }

  async function sendCode(g: Guest) {
    update(g.key, { busy: true, message: "", code: "", codeId: "", verified: false });
    try {
      const { codeId } = await post("/api/clinic/member-code", { action: "send", email: g.memberEmail });
      update(g.key, { busy: false, codeId, message: `Code sent to ${g.memberEmail.trim()}. Enter it below.` });
    } catch (err) {
      update(g.key, { busy: false, message: err instanceof Error ? err.message : "Couldn't send the code." });
    }
  }

  async function verifyCode(g: Guest) {
    update(g.key, { busy: true, message: "" });
    try {
      await post("/api/clinic/member-code", { action: "verify", codeId: g.codeId, email: g.memberEmail, code: g.code });
      update(g.key, { busy: false, verified: true, message: "" });
    } catch (err) {
      update(g.key, { busy: false, message: err instanceof Error ? err.message : "Couldn't check the code." });
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const bad = guests.find((g) => g.member && (!g.verified || !g.name.trim()));
    if (bad) {
      setError(
        !bad.name.trim()
          ? "Please enter the name of each member guest."
          : `Please verify ${bad.name.trim()}'s membership, or untick "RIHOSO member" to book them at ${dollars(CLINIC_PRICE.standardCents)}.`
      );
      return;
    }
    const f = new FormData(e.currentTarget);
    setSending(true);
    try {
      const { url } = await post("/api/clinic/checkout", {
        fullName: f.get("fullName"),
        email: f.get("email"),
        phone: f.get("phone"),
        location: f.get("location"),
        locationNotes: f.get("locationNotes"),
        occasion,
        occasionDetails: f.get("occasionDetails") ?? "",
        notes: f.get("notes"),
        accept: f.get("accept") === "on",
        website: f.get("website"),
        guests: guests.map((g) => ({
          name: g.name.trim(),
          member: g.member,
          memberEmail: g.member ? g.memberEmail.trim() : "",
          codeId: g.member ? g.codeId : "",
        })),
      });
      trackTikTok("InitiateCheckout", { content_name: "Watchmaking Clinic", content_type: "product", currency: "USD" });
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      {/* Contact */}
      <fieldset className="space-y-4">
        <legend className="font-display text-xl text-cream-50 mb-2">Your details</legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="bk-name" className={label}>Name</label>
            <input id="bk-name" name="fullName" required maxLength={120} autoComplete="name" className={inputClass} />
          </div>
          <div>
            <label htmlFor="bk-phone" className={label}>Phone</label>
            <input id="bk-phone" name="phone" type="tel" required maxLength={40} autoComplete="tel" className={inputClass} />
          </div>
        </div>
        <div>
          <label htmlFor="bk-email" className={label}>Email</label>
          <input id="bk-email" name="email" type="email" required maxLength={200} autoComplete="email" className={inputClass} />
        </div>
      </fieldset>

      {/* Guests */}
      <fieldset>
        <legend className="font-display text-xl text-cream-50">Guests</legend>
        <p className="mt-1 text-sm text-cream-300">
          {dollars(CLINIC_PRICE.standardCents)} per person, {dollars(CLINIC_PRICE.memberCents)} for each guest who is a RIHOSO
          member. Every clinic is booked for at least {CLINIC_PRICE.minimumSeats} people — leave a name blank if you don&apos;t
          know it yet and it&apos;s booked as <span className="text-cream-100">{TBD}</span> at{" "}
          {dollars(CLINIC_PRICE.standardCents)}.
        </p>
        <ol className="mt-5 space-y-3">
          {guests.map((g, i) => (
            <li key={g.key} className="rounded-lg border border-forest-600/50 bg-forest-950/30 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-3 w-6 shrink-0 text-right font-display text-gold-300">{i + 1}.</span>
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="sr-only" htmlFor={`bk-guest-${g.key}`}>Guest {i + 1} name</label>
                    <input
                      id={`bk-guest-${g.key}`}
                      value={g.name}
                      onChange={(e) => update(g.key, { name: e.target.value })}
                      maxLength={120}
                      placeholder={`Guest name (blank = ${TBD})`}
                      className={inputClass + " sm:flex-1"}
                    />
                    <label className="flex items-center gap-2 text-sm text-cream-200 whitespace-nowrap cursor-pointer">
                      <input
                        type="checkbox"
                        checked={g.member}
                        onChange={(e) => update(g.key, { member: e.target.checked, message: "" })}
                        className="h-4 w-4 accent-[#c9a84c]"
                      />
                      RIHOSO member
                    </label>
                    <button
                      type="button"
                      onClick={() => removeGuest(g.key)}
                      className="text-xs text-cream-400 hover:text-gold-300 self-start sm:self-auto"
                      aria-label={guests.length > CLINIC_PRICE.minimumSeats ? `Remove guest ${i + 1}` : `Clear guest ${i + 1}`}
                    >
                      {guests.length > CLINIC_PRICE.minimumSeats ? "Remove" : "Clear"}
                    </button>
                  </div>

                  {g.member &&
                    (g.verified ? (
                      <p className="text-sm text-gold-300">
                        ✓ Member verified ({g.memberEmail.trim()}) — {dollars(CLINIC_PRICE.memberCents)}
                        <button
                          type="button"
                          className="ml-3 text-xs text-cream-400 hover:text-gold-300 underline"
                          onClick={() => update(g.key, { verified: false, codeId: "", code: "", message: "" })}
                        >
                          change
                        </button>
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-cream-400">
                          We&apos;ll email a 6-digit code to the member&apos;s RIHOSO email to confirm the member rate.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="email"
                            value={g.memberEmail}
                            onChange={(e) => update(g.key, { memberEmail: e.target.value, codeId: "", code: "", message: "" })}
                            maxLength={200}
                            placeholder="Member's email"
                            aria-label={`Guest ${i + 1} member email`}
                            className={inputClass + " sm:flex-1 !py-2"}
                          />
                          <button type="button" className={smallBtn} disabled={g.busy || !g.memberEmail.trim()} onClick={() => sendCode(g)}>
                            {g.codeId ? "Resend code" : "Send code"}
                          </button>
                        </div>
                        {g.codeId && (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              value={g.code}
                              onChange={(e) => update(g.key, { code: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              placeholder="6-digit code"
                              aria-label={`Guest ${i + 1} member code`}
                              className={inputClass + " sm:w-40 !py-2 tracking-[0.3em]"}
                            />
                            <button type="button" className={smallBtn} disabled={g.busy || g.code.length !== 6} onClick={() => verifyCode(g)}>
                              Verify
                            </button>
                          </div>
                        )}
                        {g.message && <p className="text-xs text-cream-300">{g.message}</p>}
                      </div>
                    ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
        {guests.length < CLINIC_PRICE.maximumSeats && (
          <button type="button" onClick={addGuest} className="mt-3 text-sm text-gold-400 hover:text-gold-300 tracking-widest uppercase">
            + Add a guest
          </button>
        )}
      </fieldset>

      {/* Location */}
      <fieldset className="space-y-4">
        <legend className="font-display text-xl text-cream-50 mb-2">Location</legend>
        <div>
          <label htmlFor="bk-location" className={label}>Where would you like to hold the clinic?</label>
          <input
            id="bk-location"
            name="location"
            required
            maxLength={300}
            autoComplete="street-address"
            placeholder="Address or venue"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="bk-location-notes" className={label}>Notes about the location (optional)</label>
          <textarea
            id="bk-location-notes"
            name="locationNotes"
            rows={3}
            maxLength={2000}
            className={inputClass + " resize-none"}
            placeholder="Parking, which entrance, the room or table we'll be using, anything we should know."
          />
        </div>
      </fieldset>

      {/* Occasion */}
      <fieldset className="space-y-4">
        <legend className="font-display text-xl text-cream-50 mb-2">Occasion</legend>
        <div>
          <label htmlFor="bk-occasion" className={label}>Is this for a special occasion?</label>
          <select
            id="bk-occasion"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            className={inputClass + " appearance-none"}
          >
            <option value="">No special occasion</option>
            {OCCASIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        {occasion && (
          <div>
            <label htmlFor="bk-occasion-details" className={label}>
              {occasion === "other" ? "Please describe the occasion" : "Tell us about it (optional)"}
            </label>
            <input
              id="bk-occasion-details"
              name="occasionDetails"
              required={occasion === "other"}
              maxLength={500}
              className={inputClass}
              placeholder={occasion === "other" ? "e.g. retirement, club outing, family reunion" : "e.g. whose birthday, or who the gift is for"}
            />
          </div>
        )}
        <div>
          <label htmlFor="bk-notes" className={label}>Anything else? (optional)</label>
          <textarea
            id="bk-notes"
            name="notes"
            rows={3}
            maxLength={3000}
            className={inputClass + " resize-none"}
            placeholder="Preferred dates or times, ages for a school group, a surprise for the guest of honor…"
          />
        </div>
      </fieldset>

      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-gold-400/30 bg-forest-800/60 p-5">
        <dl className="space-y-1 text-cream-200">
          {price.standardSeats > 0 && (
            <div className="flex justify-between gap-4">
              <dt>{price.standardSeats} × seat at {dollars(CLINIC_PRICE.standardCents)}</dt>
              <dd>{dollars(price.standardSeats * CLINIC_PRICE.standardCents)}</dd>
            </div>
          )}
          {price.memberSeats > 0 && (
            <div className="flex justify-between gap-4">
              <dt>{price.memberSeats} × member seat at {dollars(CLINIC_PRICE.memberCents)}</dt>
              <dd>{dollars(price.memberSeats * CLINIC_PRICE.memberCents)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 pt-2 mt-2 border-t border-gold-400/20 font-display text-xl text-cream-50">
            <dt>Total ({price.seats} people)</dt>
            <dd className="text-gold-foil">{dollars(price.totalCents)}</dd>
          </div>
        </dl>
        {unverified > 0 && (
          <p className="mt-3 text-xs text-cream-400">
            {unverified === 1 ? "1 member guest isn't" : `${unverified} member guests aren't`} verified yet and{" "}
            {unverified === 1 ? "is" : "are"} shown at {dollars(CLINIC_PRICE.standardCents)}.
          </p>
        )}
      </div>

      <label className="flex items-start gap-3 text-sm text-cream-300 cursor-pointer">
        <input type="checkbox" name="accept" required className="mt-1 h-4 w-4 accent-[#c9a84c]" />
        <span>
          I understand RIHOSO will contact me after payment to set the date and watchmaker, and that if we can&apos;t find a
          date that works, I&apos;ll get a full refund.
        </span>
      </label>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <button type="submit" disabled={sending} className="btn-gold w-full px-8 py-4 tracking-widest uppercase disabled:opacity-60">
        {sending ? "Opening secure payment…" : `Pay ${dollars(price.totalCents)} & book`}
      </button>
      <p className="text-xs text-cream-400 text-center">Secure card payment by Stripe. A confirmation email follows right away.</p>
    </form>
  );
}
