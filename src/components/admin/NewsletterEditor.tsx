"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PHOTO_BUCKET,
  SECTIONS,
  issueMonthLabel,
  type NewsletterPhoto,
  type NewsletterSection,
  type SectionKey,
} from "@/lib/newsletter-sections";
import { createClient } from "@/lib/supabase/browser";

type Issue = {
  id: string;
  slug: string;
  issue_date: string;
  title: string;
  intro: string;
  sections: NewsletterSection[];
  status: string;
  sent_at: string | null;
};

const label = "block text-sm text-cream-200 mb-1";
const input =
  "w-full bg-forest-950/60 border border-forest-600/50 rounded px-3 py-2 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60 transition-colors";

/** Shrinks a photo to at most 2000px on its long side and re-encodes it as JPEG, so phone photos upload quickly. */
async function prepare(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86));
    if (blob) return blob;
  } catch {
    // Fall through: upload the original if the browser can't read it.
  }
  return file;
}

function emptySection(key: SectionKey): NewsletterSection {
  return { key, title: "", blurb: "", body: "", photos: [], sources: [] };
}

export default function NewsletterEditor({
  issue,
  statusLabel,
  todo,
  photoBase,
  adminEmail,
  openMonths,
}: {
  issue: Issue | null;
  statusLabel: string;
  todo: string[];
  photoBase: string;
  adminEmail: string;
  openMonths: string[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(issue?.title ?? "");
  const [intro, setIntro] = useState(issue?.intro ?? "");
  const [sections, setSections] = useState<NewsletterSection[]>(() =>
    SECTIONS.map((d) => issue?.sections.find((s) => s.key === d.key) ?? emptySection(d.key))
  );
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [newMonth, setNewMonth] = useState(openMonths[0] ?? "");

  const editable = issue && (issue.status === "draft" || issue.status === "approved");

  function update(key: SectionKey, patch: Partial<NewsletterSection>) {
    setSections((list) => list.map((s) => (s.key === key ? { ...s, ...patch } : s)));
    setDirty(true);
  }
  function updatePhoto(key: SectionKey, path: string, patch: Partial<NewsletterPhoto>) {
    const s = sections.find((x) => x.key === key)!;
    update(key, { photos: s.photos.map((p) => (p.path === path ? { ...p, ...patch } : p)) });
  }

  async function call(action: string, extra: Record<string, unknown> = {}) {
    const res = await fetch("/api/marketplace/admin/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id: issue?.id, ...extra }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || "Something went wrong.");
    return json;
  }

  async function save(quiet = false, list = sections) {
    await call("save", { title, intro, sections: list });
    setDirty(false);
    if (!quiet) setNotice({ kind: "ok", text: "Saved." });
    router.refresh();
  }

  async function run(name: string, fn: () => Promise<void>) {
    setBusy(name);
    setNotice(null);
    try {
      await fn();
    } catch (err) {
      setNotice({ kind: "error", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setBusy("");
    }
  }

  async function upload(key: SectionKey, files: FileList | null) {
    if (!issue || !files?.length) return;
    const def = SECTIONS.find((d) => d.key === key)!;
    const current = sections.find((s) => s.key === key)!;
    const room = def.photos - current.photos.length;
    const picked = Array.from(files).slice(0, room);
    await run("upload", async () => {
      const supabase = createClient();
      const added: NewsletterPhoto[] = [];
      for (const file of picked) {
        const blob = await prepare(file);
        const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
        const path = `${issue.slug}/${key}-${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: blob.type || "image/jpeg", cacheControl: "31536000" });
        if (up.error) throw new Error(`Upload failed: ${up.error.message}`);
        added.push({ path, caption: "", credit: "" });
      }
      const next = sections.map((s) => (s.key === key ? { ...s, photos: [...s.photos, ...added] } : s));
      setSections(next);
      await save(true, next);
      setNotice({ kind: "ok", text: `Photo${added.length > 1 ? "s" : ""} added and saved. Add a caption and credit below.` });
    });
  }

  if (!issue) {
    return (
      <div className="panel-lux rounded-xl p-6 sm:p-8">
        <h2 className="font-display text-2xl text-cream-50">No issues yet</h2>
        <p className="mt-2 text-sm text-cream-300">The monthly writer drafts each issue around the 25th. You can also start one by hand.</p>
        {openMonths.length > 0 && (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className={label} htmlFor="nm">Month</label>
              <select id="nm" className={input} value={newMonth} onChange={(e) => setNewMonth(e.target.value)}>
                {openMonths.map((d) => <option key={d} value={d}>{issueMonthLabel(d)}</option>)}
              </select>
            </div>
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => run("create", async () => {
                const r = await call("create", { issue_date: newMonth });
                router.push(`/marketplace/admin/newsletter?issue=${r.slug}`);
                router.refresh();
              })}
              className="px-5 py-2 rounded bg-gold-400 text-forest-950 font-semibold disabled:opacity-50"
            >
              Start a blank issue
            </button>
          </div>
        )}
        {notice && <p className={`mt-4 text-sm ${notice.kind === "ok" ? "text-gold-200" : "text-red-200"}`}>{notice.text}</p>}
      </div>
    );
  }

  const isApproved = issue.status === "approved";
  return (
    <div className="space-y-6">
      <div className="panel-lux rounded-xl p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-cream-400">{issueMonthLabel(issue.issue_date)} issue · goes out {issue.issue_date} at 9 AM</p>
            <p className={`mt-1 font-semibold ${isApproved ? "text-gold-300" : issue.status === "sent" ? "text-cream-200" : "text-cream-100"}`}>{statusLabel}</p>
          </div>
          <a href={`/newsletter/${issue.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-gold-400 underline hover:text-gold-300">
            Preview as members see it ↗
          </a>
        </div>
        {todo.length > 0 && editable && (
          <ul className="mt-4 text-sm text-cream-300 list-disc pl-5 space-y-1">
            {todo.map((t) => <li key={t}>{t}</li>)}
          </ul>
        )}
        {!editable && <p className="mt-4 text-sm text-cream-300">This issue has gone out and can no longer be edited.</p>}
      </div>

      <fieldset disabled={!editable} className="space-y-6">
        <div className="panel-lux rounded-xl p-6 sm:p-8 space-y-4">
          <div>
            <label className={label} htmlFor="nl-title">Issue title</label>
            <input id="nl-title" className={input} value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }} maxLength={140} />
          </div>
          <div>
            <label className={label} htmlFor="nl-intro">Opening note (also starts the email)</label>
            <textarea id="nl-intro" className={input} rows={5} value={intro} onChange={(e) => { setIntro(e.target.value); setDirty(true); }} maxLength={1200} />
          </div>
        </div>

        {SECTIONS.map((def) => {
          const s = sections.find((x) => x.key === def.key)!;
          return (
            <div key={def.key} className="panel-lux rounded-xl p-6 sm:p-8 space-y-4" id={`edit-${def.key}`}>
              <div>
                <p className="text-gold-400 uppercase tracking-[0.2em] text-xs">{def.label}</p>
                <p className="text-xs text-cream-400 mt-1">{def.guide}</p>
              </div>
              <div>
                <label className={label}>Title</label>
                <input className={input} value={s.title} maxLength={140} onChange={(e) => update(def.key, { title: e.target.value })} />
              </div>
              <div>
                <label className={label}>Email blurb (one or two sentences)</label>
                <textarea className={input} rows={2} value={s.blurb} maxLength={400} onChange={(e) => update(def.key, { blurb: e.target.value })} />
              </div>
              <div>
                <label className={label}>Full text <span className="text-cream-400">(blank line between paragraphs; &quot;- &quot; for a list; **bold**; [text in brackets] marks something to fill in)</span></label>
                <textarea className={`${input} font-mono text-sm`} rows={Math.min(24, Math.max(6, Math.ceil(s.body.length / 90)))} value={s.body} maxLength={14000} onChange={(e) => update(def.key, { body: e.target.value })} />
              </div>

              {def.photos > 0 && (
                <div>
                  <p className={label}>Photos ({s.photos.length} of {def.photos})</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {s.photos.map((p) => (
                      <div key={p.path} className="rounded border border-forest-600/50 p-3 space-y-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`${photoBase}${p.path}`} alt={p.caption} className="w-full aspect-[4/3] object-cover rounded" />
                        <input className={input} placeholder="Caption" value={p.caption} maxLength={200} onChange={(e) => updatePhoto(def.key, p.path, { caption: e.target.value })} />
                        <input className={input} placeholder="Photo credit (e.g. the store, or your name)" value={p.credit} maxLength={120} onChange={(e) => updatePhoto(def.key, p.path, { credit: e.target.value })} />
                        <button type="button" className="text-xs text-red-200 underline" onClick={() => update(def.key, { photos: s.photos.filter((x) => x.path !== p.path) })}>
                          Remove photo
                        </button>
                      </div>
                    ))}
                  </div>
                  {s.photos.length < def.photos && editable && (
                    <label className="mt-3 inline-block cursor-pointer px-4 py-2 rounded border border-gold-400/50 text-gold-300 hover:bg-gold-400/10 text-sm">
                      {busy === "upload" ? "Uploading…" : `Add photo${def.photos - s.photos.length > 1 ? "s" : ""}`}
                      <input type="file" accept="image/*" multiple={def.photos - s.photos.length > 1} className="hidden" onChange={(e) => { upload(def.key, e.target.files); e.target.value = ""; }} />
                    </label>
                  )}
                </div>
              )}

              {s.sources.length > 0 && (
                <details className="text-xs text-cream-400">
                  <summary className="cursor-pointer">Writer&apos;s sources ({s.sources.length})</summary>
                  <ul className="mt-2 space-y-1">
                    {s.sources.map((src) => (
                      <li key={src.url}><a href={src.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-gold-300">{src.title}</a></li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          );
        })}
      </fieldset>

      {editable && (
        <div className="sticky bottom-0 z-10 -mx-4 sm:mx-0 bg-forest-900/95 backdrop-blur border-t sm:border border-gold-400/20 sm:rounded-xl px-4 py-4 flex flex-wrap items-center gap-3">
          <button type="button" disabled={Boolean(busy) || !dirty} onClick={() => run("save", () => save())} className="px-5 py-2 rounded bg-gold-400 text-forest-950 font-semibold disabled:opacity-40">
            {busy === "save" ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </button>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => run("test", async () => {
              if (dirty) await save(true);
              const r = await call("test");
              setNotice({ kind: "ok", text: `Test email sent to ${r.sentTo || adminEmail}.` });
            })}
            className="px-4 py-2 rounded border border-gold-400/50 text-gold-300 hover:bg-gold-400/10 disabled:opacity-40"
          >
            {busy === "test" ? "Sending…" : "Email me a test"}
          </button>
          {isApproved ? (
            <>
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => run("unapprove", async () => { if (dirty) await save(true); await call("unapprove"); router.refresh(); })}
                className="px-4 py-2 rounded border border-forest-600 text-cream-200 hover:border-gold-400/50 disabled:opacity-40"
              >
                Move back to draft
              </button>
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => run("send", async () => {
                  if (!window.confirm(`Send the ${issueMonthLabel(issue.issue_date)} issue to all current members now?\n\nThis can't be undone.`)) return;
                  if (dirty) await save(true);
                  const r = await call("send");
                  setNotice({ kind: "ok", text: `Sent to ${r.sent} ${r.sent === 1 ? "person" : "people"}${r.failed ? ` (${r.failed} failed)` : ""}.` });
                  router.refresh();
                })}
                className="px-4 py-2 rounded border border-red-300/50 text-red-100 hover:bg-red-900/30 disabled:opacity-40"
              >
                {busy === "send" ? "Sending…" : "Send now instead"}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => run("approve", async () => {
                if (todo.length && !window.confirm(`Still open:\n\n• ${todo.join("\n• ")}\n\nApprove anyway?`)) return;
                if (dirty) await save(true);
                await call("approve");
                router.refresh();
              })}
              className="px-5 py-2 rounded bg-forest-600 text-cream-50 font-semibold hover:bg-forest-500 disabled:opacity-40"
            >
              {busy === "approve" ? "Approving…" : `Approve for ${issueMonthLabel(issue.issue_date).split(" ")[0]} 1`}
            </button>
          )}
          {notice && <p className={`text-sm ${notice.kind === "ok" ? "text-gold-200" : "text-red-200"}`} role="status">{notice.text}</p>}
        </div>
      )}
    </div>
  );
}
