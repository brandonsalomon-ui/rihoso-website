"use client";

import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";
import { CONTACT_METHODS, REPAIR_RULES, type ContactMethod } from "@/lib/marketplace";
import { createClient } from "@/lib/supabase/browser";
import { REPAIR_PHOTO_BUCKET } from "@/lib/supabase/config";
import { inputClass } from "./SignInForm";

const MAX_BYTES = 10 * 1024 * 1024;

function extFor(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^(jpe?g|png|webp|heic|heif)$/.test(fromName)) return fromName;
  return file.type.split("/")[1] || "jpg";
}

const label = "block text-sm text-cream-200 mb-1";
const req = <span className="text-gold-400">*</span>;

export default function RepairRequestForm({ userId, email }: { userId: string; email: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [method, setMethod] = useState<ContactMethod>("email");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [sentId, setSentId] = useState("");

  function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    const tooBig = picked.find((f) => f.size > MAX_BYTES);
    setError(tooBig ? `${tooBig.name} is over 10 MB — please choose a smaller photo.` : "");
    const next = [...files, ...picked.filter((f) => f.size <= MAX_BYTES)].slice(0, REPAIR_RULES.maxPhotos);
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
    e.target.value = "";
  }

  function removePhoto(idx: number) {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const issue = String(f.get("issue") ?? "").trim();
    const phone = String(f.get("phone") ?? "").trim();
    const problems: string[] = [];
    if (!String(f.get("brand") ?? "").trim()) problems.push("the watch brand");
    if (issue.length < REPAIR_RULES.minIssue) problems.push("a few words about what's wrong with the watch");
    if (files.length < REPAIR_RULES.minPhotos) problems.push("at least one photo of the watch (dial and caseback help most)");
    if (!String(f.get("name") ?? "").trim()) problems.push("your name");
    if (method !== "email" && phone.replace(/\D/g, "").length < 7) problems.push("a phone number we can call or text");
    if (problems.length) {
      setError(`Please add ${problems.join("; ")}.`);
      return;
    }
    setError("");

    try {
      const supabase = createClient();
      const folder = `${userId}/${crypto.randomUUID()}`;
      const photoPaths: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setBusy(`Uploading photo ${i + 1} of ${files.length}…`);
        const path = `${folder}/${i + 1}.${extFor(files[i])}`;
        const up = await supabase.storage.from(REPAIR_PHOTO_BUCKET).upload(path, files[i], {
          contentType: files[i].type || undefined,
        });
        if (up.error) throw new Error(`Photo ${i + 1} failed to upload: ${up.error.message}`);
        photoPaths.push(path);
      }

      setBusy("Sending your request…");
      const year = parseInt(String(f.get("year") ?? ""), 10);
      const res = await fetch("/api/marketplace/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "repair",
          contactName: f.get("name"),
          contactPhone: phone,
          contactMethod: method,
          watchBrand: f.get("brand"),
          watchModel: f.get("model"),
          watchReference: f.get("reference"),
          watchYear: Number.isFinite(year) ? year : null,
          description: issue,
          photoPaths,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Couldn't send the request.");
      setSentId(json.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy("");
    }
  }

  if (sentId) {
    const how = method === "email" ? `by email at ${email}` : method === "phone" ? "by phone" : "by text";
    return (
      <div className="panel-lux rounded-xl p-8 text-center space-y-3" role="status">
        <h2 className="text-2xl font-display text-cream-50">Request received</h2>
        <p className="text-cream-300">
          Thank you. RIHOSO will review your watch and get back to you {how} with a price or any questions.
          Please don&apos;t send the watch until you&apos;ve agreed to a written quote.
        </p>
        <Link href={`/marketplace/requests/${sentId}`} className="inline-block text-gold-400 hover:text-gold-300 text-sm">
          View your request →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="panel-lux rounded-xl p-6 sm:p-8 space-y-8">
      <fieldset className="space-y-4">
        <legend className="font-display text-xl text-cream-50 mb-2">Your watch</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label} htmlFor="rp-brand">Brand {req}</label>
            <input id="rp-brand" name="brand" required maxLength={60} className={inputClass} placeholder="Omega" />
          </div>
          <div>
            <label className={label} htmlFor="rp-model">Model</label>
            <input id="rp-model" name="model" maxLength={80} className={inputClass} placeholder="Speedmaster Professional" />
          </div>
          <div>
            <label className={label} htmlFor="rp-ref">Reference number <span className="text-cream-400">(if known)</span></label>
            <input id="rp-ref" name="reference" maxLength={60} className={inputClass} placeholder="311.30.42.30.01.005" />
          </div>
          <div>
            <label className={label} htmlFor="rp-year">Approximate year</label>
            <input id="rp-year" name="year" type="number" min={1700} max={2100} className={inputClass} placeholder="2018" />
          </div>
        </div>
      </fieldset>

      <div>
        <label className={label} htmlFor="rp-issue">
          What&apos;s the issue? {req}{" "}
          <span className="text-cream-400">(symptoms, when it started, last service, anything you&apos;ve noticed)</span>
        </label>
        <textarea id="rp-issue" name="issue" maxLength={4000} rows={6} className={inputClass}
          placeholder="Running about 30 seconds a day slow and stops overnight. Last serviced around 2015. The crown feels gritty when winding…" />
      </div>

      <div>
        <p className={label}>
          Photos {req}{" "}
          <span className="text-cream-400">
            (at least {REPAIR_RULES.minPhotos}, up to {REPAIR_RULES.maxPhotos}: dial, caseback, and a close-up of any damage)
          </span>
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {previews.map((src, i) => (
            <div key={src} className="relative aspect-square rounded overflow-hidden bg-forest-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removePhoto(i)} aria-label={`Remove photo ${i + 1}`}
                className="absolute top-1 right-1 bg-forest-950/80 text-cream-100 rounded-full w-6 h-6 text-xs">✕</button>
            </div>
          ))}
          {files.length < REPAIR_RULES.maxPhotos && (
            <label className="aspect-square rounded border border-dashed border-gold-400/40 flex items-center justify-center text-gold-300 text-sm cursor-pointer hover:bg-gold-400/5">
              + Add
              <input type="file" accept="image/*" multiple onChange={onFiles} className="sr-only" />
            </label>
          )}
        </div>
        <p className="text-xs text-cream-400 mt-2">Photos are private — only you and RIHOSO can see them.</p>
      </div>

      <fieldset className="space-y-4">
        <legend className="font-display text-xl text-cream-50 mb-2">How should we reach you?</legend>
        <div>
          <label className={label} htmlFor="rp-name">Your name {req}</label>
          <input id="rp-name" name="name" required maxLength={120} autoComplete="name" className={inputClass} />
        </div>
        <div>
          <p className={label}>Best way to contact you {req}</p>
          <div className="flex flex-wrap gap-3" role="radiogroup">
            {CONTACT_METHODS.map((m) => (
              <label key={m.value}
                className={`flex items-center gap-2 px-4 py-2 rounded border cursor-pointer text-sm ${
                  method === m.value ? "border-gold-400 text-gold-200 bg-gold-400/10" : "border-forest-600/50 text-cream-200"
                }`}>
                <input type="radio" name="contact_method" value={m.value} checked={method === m.value}
                  onChange={() => setMethod(m.value)} className="accent-gold-400" />
                {m.label}
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label} htmlFor="rp-email">Email</label>
            <input id="rp-email" value={email} readOnly className={inputClass + " opacity-70"} />
          </div>
          <div>
            <label className={label} htmlFor="rp-phone">Phone {method !== "email" ? req : <span className="text-cream-400">(optional)</span>}</label>
            <input id="rp-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" required={method !== "email"}
              className={inputClass} placeholder="(401) 555-0123" />
          </div>
        </div>
      </fieldset>

      <p className="text-xs text-cream-400 leading-relaxed">
        This is a request for a quote only. RIHOSO will review your description and photos and get back to you with a
        price or a call. No work is agreed and nothing should be sent until you approve a written quote.
      </p>

      {error && <p className="text-sm text-red-300 bg-red-900/30 border border-red-400/30 rounded px-4 py-3" role="alert">{error}</p>}

      <button disabled={Boolean(busy)} className="btn-gold w-full py-3 rounded font-semibold disabled:opacity-60">
        {busy || "Request a repair quote"}
      </button>
    </form>
  );
}
