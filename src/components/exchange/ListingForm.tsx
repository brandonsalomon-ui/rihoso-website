"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CONDITIONS } from "@/lib/exchange-types";
import { LISTING_RULES } from "@/lib/marketplace";
import { PHOTO_BUCKET } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/browser";
import { inputClass } from "./SignInForm";

const MAX_PHOTOS = 10;
const MAX_BYTES = 10 * 1024 * 1024;

function extFor(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^(jpe?g|png|webp|heic|heif)$/.test(fromName)) return fromName;
  return file.type.split("/")[1] || "jpg";
}

export default function ListingForm({ userId, canPublish }: { userId: string; canPublish: boolean }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    const tooBig = picked.find((f) => f.size > MAX_BYTES);
    if (tooBig) setError(`${tooBig.name} is over 10 MB — please choose a smaller photo.`);
    const next = [...files, ...picked.filter((f) => f.size <= MAX_BYTES)].slice(0, MAX_PHOTOS);
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
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const publish = submitter?.value === "publish";
    const f = new FormData(e.currentTarget);
    if (f.get("allows_shipping") !== "on" && f.get("allows_pickup") !== "on") {
      setError("Choose insured shipping, local pickup, or both.");
      return;
    }
    if (publish) {
      const problems: string[] = [];
      if (!String(f.get("reference") ?? "").trim()) problems.push("the reference number");
      if (String(f.get("description") ?? "").trim().length < LISTING_RULES.minDescription)
        problems.push("a description of at least a couple of sentences (condition, service history, what's included)");
      if (files.length < LISTING_RULES.minPhotos)
        problems.push(`at least ${LISTING_RULES.minPhotos} photos — dial, caseback and clasp/bracelet`);
      if (problems.length) {
        setError(`To publish, please add ${problems.join("; ")}. You can also save as a draft and finish later.`);
        return;
      }
    }
    setError("");
    const price = Math.round(parseFloat(String(f.get("price") ?? "").replace(/[$,]/g, "")) * 100);
    if (!Number.isFinite(price) || price < 100) {
      setError("Please enter a price of at least $1.");
      return;
    }
    const year = parseInt(String(f.get("year") ?? ""), 10);
    const supabase = createClient();

    try {
      setBusy("Saving listing…");
      const { data: listing, error: insertError } = await supabase
        .from("listings")
        .insert({
          seller_id: userId,
          title: String(f.get("title")).trim(),
          brand: String(f.get("brand")).trim(),
          model: String(f.get("model") ?? "").trim() || null,
          reference: String(f.get("reference") ?? "").trim() || null,
          year: Number.isFinite(year) ? year : null,
          condition: String(f.get("condition")),
          has_box: f.get("has_box") === "on",
          has_papers: f.get("has_papers") === "on",
          description: String(f.get("description") ?? "").trim(),
          price_cents: price,
          allows_shipping: f.get("allows_shipping") === "on",
          allows_pickup: f.get("allows_pickup") === "on",
          pickup_area: String(f.get("pickup_area") ?? "").trim() || null,
          status: "draft",
        })
        .select("id")
        .single();
      if (insertError || !listing) throw new Error(insertError?.message || "Couldn't save the listing.");

      for (let i = 0; i < files.length; i++) {
        setBusy(`Uploading photo ${i + 1} of ${files.length}…`);
        const path = `${userId}/${listing.id}/${crypto.randomUUID()}.${extFor(files[i])}`;
        const up = await supabase.storage.from(PHOTO_BUCKET).upload(path, files[i], {
          contentType: files[i].type || undefined,
          cacheControl: "31536000",
        });
        if (up.error) throw new Error(`Photo ${i + 1} failed to upload: ${up.error.message}`);
        const { error: photoError } = await supabase
          .from("listing_photos")
          .insert({ listing_id: listing.id, storage_path: path, position: i });
        if (photoError) throw new Error(photoError.message);
      }

      if (publish) {
        setBusy("Publishing…");
        const { error: pubError } = await supabase.from("listings").update({ status: "active" }).eq("id", listing.id);
        if (pubError) throw new Error(/required to publish/.test(pubError.message) ? `Saved as a draft. ${pubError.message}` : "Saved as a draft, but couldn't publish yet — finish your seller setup first.");
      }
      router.push(`/marketplace/listings/${listing.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel-lux rounded-xl p-6 sm:p-8 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm text-cream-200 mb-1" htmlFor="lf-title">Listing title <span className="text-gold-400">*</span></label>
          <input id="lf-title" name="title" required minLength={3} maxLength={120} className={inputClass} placeholder="e.g. Omega Speedmaster Professional 311.30.42.30.01.005" />
        </div>
        <div>
          <label className="block text-sm text-cream-200 mb-1" htmlFor="lf-brand">Brand <span className="text-gold-400">*</span></label>
          <input id="lf-brand" name="brand" required maxLength={60} className={inputClass} placeholder="Omega" />
        </div>
        <div>
          <label className="block text-sm text-cream-200 mb-1" htmlFor="lf-model">Model</label>
          <input id="lf-model" name="model" maxLength={80} className={inputClass} placeholder="Speedmaster Professional" />
        </div>
        <div>
          <label className="block text-sm text-cream-200 mb-1" htmlFor="lf-ref">Reference number <span className="text-gold-400">*</span></label>
          <input id="lf-ref" name="reference" maxLength={60} className={inputClass} placeholder="311.30.42.30.01.005" />
        </div>
        <div>
          <label className="block text-sm text-cream-200 mb-1" htmlFor="lf-year">Year</label>
          <input id="lf-year" name="year" type="number" min={1700} max={2100} className={inputClass} placeholder="2018" />
        </div>
        <div>
          <label className="block text-sm text-cream-200 mb-1" htmlFor="lf-cond">Condition <span className="text-gold-400">*</span></label>
          <select id="lf-cond" name="condition" required defaultValue="excellent" className={inputClass}>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-cream-200 mb-1" htmlFor="lf-price">Asking price (USD) <span className="text-gold-400">*</span></label>
          <input id="lf-price" name="price" required inputMode="decimal" className={inputClass} placeholder="5,200" />
        </div>
        <div className="flex items-center gap-6 sm:col-span-2 text-sm text-cream-200">
          <label className="flex items-center gap-2"><input type="checkbox" name="has_box" className="accent-gold-400" /> Original box</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="has_papers" className="accent-gold-400" /> Papers / warranty card</label>
        </div>
        <fieldset className="sm:col-span-2 space-y-2">
          <legend className="block text-sm text-cream-200 mb-1">How can the buyer get it? <span className="text-gold-400">*</span></legend>
          <label className="flex items-center gap-2 text-sm text-cream-200">
            <input type="checkbox" name="allows_shipping" defaultChecked className="accent-gold-400" />
            I&apos;ll ship it fully insured with signature required (your price includes shipping)
          </label>
          <label className="flex items-center gap-2 text-sm text-cream-200">
            <input type="checkbox" name="allows_pickup" className="accent-gold-400" /> Local pickup is OK
          </label>
          <input name="pickup_area" maxLength={80} className={inputClass} placeholder="Pickup area, e.g. Providence / East Greenwich, or at a RIHOSO meeting" />
        </fieldset>
        <div className="sm:col-span-2">
          <label className="block text-sm text-cream-200 mb-1" htmlFor="lf-desc">
            Description <span className="text-gold-400">*</span>{" "}
            <span className="text-cream-400">(at least a couple of sentences: condition, service history, what&apos;s included, any flaws)</span>
          </label>
          <textarea id="lf-desc" name="description" rows={6} maxLength={8000} className={inputClass} placeholder="Condition details, service history, what's included, any flaws…" />
        </div>
      </div>

      <div>
        <p className="block text-sm text-cream-200 mb-2">
          Photos <span className="text-gold-400">*</span>{" "}
          <span className="text-cream-400">
            (at least {LISTING_RULES.minPhotos}: dial, caseback, clasp/bracelet — up to {MAX_PHOTOS}; the first is the cover)
          </span>
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {previews.map((src, i) => (
            <div key={src} className="relative aspect-square rounded overflow-hidden bg-forest-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removePhoto(i)} aria-label="Remove photo"
                className="absolute top-1 right-1 bg-forest-950/80 text-cream-100 rounded-full w-6 h-6 text-xs">✕</button>
            </div>
          ))}
          {files.length < MAX_PHOTOS && (
            <label className="aspect-square rounded border border-dashed border-gold-400/40 flex items-center justify-center text-gold-300 text-sm cursor-pointer hover:bg-gold-400/5">
              + Add
              <input type="file" accept="image/*" multiple onChange={onFiles} className="sr-only" />
            </label>
          )}
        </div>
      </div>

      <p className="text-xs text-cream-400"><span className="text-gold-400">*</span> Required to publish. Drafts can be saved anytime.</p>
      <p className="text-xs text-cream-400">
        By listing, you confirm you own this watch, the description is accurate, and you&apos;ll ship it insured with
        tracking once a buyer pays. RIHOSO is the venue, not the seller.
      </p>

      {error && <p className="text-sm text-red-300 bg-red-900/30 border border-red-400/30 rounded px-4 py-3" role="alert">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-3">
        {canPublish && (
          <button type="submit" name="action" value="publish" disabled={Boolean(busy)} className="btn-gold flex-1 py-3 rounded font-semibold disabled:opacity-60">
            {busy || "Publish listing"}
          </button>
        )}
        <button type="submit" name="action" value="draft" disabled={Boolean(busy)}
          className="flex-1 py-3 rounded border border-cream-200/30 text-cream-100 hover:border-gold-400 disabled:opacity-60">
          {canPublish ? "Save as draft" : busy || "Save as draft"}
        </button>
      </div>
    </form>
  );
}
