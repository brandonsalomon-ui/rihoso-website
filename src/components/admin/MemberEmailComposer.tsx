"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export type AudienceOption = { id: string; label: string; hint: string; count: number; skipped: number };

const label = "block text-sm text-cream-200 mb-1";
const inputClass =
  "w-full bg-forest-950/60 border border-forest-600/50 rounded px-4 py-3 text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60 transition-colors";

/** Write an announcement, email yourself a test, then send it to a chosen group. */
export default function MemberEmailComposer({ audiences, adminEmail }: { audiences: AudienceOption[]; adminEmail: string }) {
  const router = useRouter();
  const [audienceId, setAudienceId] = useState(audiences[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("Dear {first_name},\n\n");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [toName, setToName] = useState("");
  const [busy, setBusy] = useState<"" | "test" | "send">("");
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [tested, setTested] = useState(false);

  const options = useMemo<AudienceOption[]>(
    () => [...audiences, { id: "one", label: "One person (a personal note)", hint: "Sent as a plain letter from you, without the RIHOSO banner or unsubscribe footer", count: 1, skipped: 0 }],
    [audiences]
  );
  const audience = useMemo(() => options.find((a) => a.id === audienceId), [options, audienceId]);
  const personal = audienceId === "one";

  async function post(action: "test" | "send") {
    setBusy(action);
    setNotice(null);
    const res = await fetch("/api/marketplace/admin/mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, audience: audienceId, toEmail, toName, subject, body, ctaLabel, ctaUrl, expectedCount: audience?.count }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy("");
    return { ok: res.ok, json };
  }

  async function test() {
    const { ok, json } = await post("test");
    if (!ok) return setNotice({ kind: "error", text: json.error || "The test didn't send." });
    setTested(true);
    setNotice({ kind: "ok", text: `Test sent to ${json.sentTo}. Check how it looks, then send for real.` });
  }

  async function send() {
    if (!audience) return;
    const people = personal ? toEmail : `${audience.count} ${audience.count === 1 ? "person" : "people"} (${audience.label})`;
    if (!confirm(`Send "${subject}" to ${people}?\n\nThis can't be undone.`)) return;
    const { ok, json } = await post("send");
    if (!ok) return setNotice({ kind: "error", text: json.error || "Nothing was sent." });
    setNotice({
      kind: json.failed ? "error" : "ok",
      text: `Sent to ${json.sent}${json.failed ? ` — ${json.failed} failed (see the sent log)` : ""}.${json.skipped ? ` ${json.skipped} unsubscribed ${json.skipped === 1 ? "person was" : "people were"} skipped.` : ""}`,
    });
    if (!json.failed) {
      setSubject("");
      setBody("Dear {first_name},\n\n");
      setCtaLabel("");
      setCtaUrl("");
      setToEmail("");
      setToName("");
      setTested(false);
    }
    router.refresh();
  }

  const ready =
    subject.trim() && body.trim().length >= 10 && audience && audience.count > 0 && (!personal || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail.trim()));

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="mail-audience" className={label}>Send to</label>
        <select id="mail-audience" value={audienceId} onChange={(e) => setAudienceId(e.target.value)} className={inputClass}>
          {options.map((a) => (
            <option key={a.id} value={a.id}>
              {a.id === "one" ? a.label : `${a.label} — ${a.count} ${a.count === 1 ? "person" : "people"}`}
            </option>
          ))}
        </select>
        {audience && (
          <p className="text-xs text-cream-400 mt-1">
            {audience.hint}.{audience.skipped ? ` ${audience.skipped} unsubscribed — they'll be skipped.` : ""}
          </p>
        )}
      </div>

      {personal && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="mail-to-email" className={label}>Their email</label>
            <input id="mail-to-email" type="email" value={toEmail} onChange={(e) => setToEmail(e.target.value)} maxLength={200} className={inputClass} />
          </div>
          <div>
            <label htmlFor="mail-to-name" className={label}>Their name</label>
            <input id="mail-to-name" value={toName} onChange={(e) => setToName(e.target.value)} maxLength={120} className={inputClass} />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="mail-subject" className={label}>Subject</label>
        <input
          id="mail-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={200}
          placeholder="e.g. Members' evening at Capriccio — Nov 24"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="mail-body" className={label}>Message</label>
        <textarea
          id="mail-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          maxLength={20000}
          className={`${inputClass} font-sans leading-relaxed`}
        />
        <p className="text-xs text-cream-400 mt-1">
          Leave a blank line between paragraphs. <code className="text-gold-300">{"{first_name}"}</code> becomes each
          person&apos;s first name. Web links become clickable. An unsubscribe link is added automatically.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="mail-cta-label" className={label}>Button text <span className="text-cream-400">(optional)</span></label>
          <input id="mail-cta-label" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} maxLength={60} placeholder="RSVP now" className={inputClass} />
        </div>
        <div>
          <label htmlFor="mail-cta-url" className={label}>Button link</label>
          <input id="mail-cta-url" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} maxLength={500} placeholder="https://rihoso.com/events" className={inputClass} />
        </div>
      </div>

      {notice && (
        <p className={`text-sm rounded px-4 py-3 ${notice.kind === "ok" ? "bg-forest-700/50 text-gold-200" : "bg-red-900/20 text-red-200 border border-red-400/30"}`}>
          {notice.text}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={test}
          disabled={!ready || busy !== ""}
          className="border border-cream-200/30 text-cream-100 hover:border-gold-400 px-5 py-2.5 rounded text-sm font-semibold disabled:opacity-50"
        >
          {busy === "test" ? "Sending test…" : `Email me a test${adminEmail ? ` (${adminEmail})` : ""}`}
        </button>
        <button onClick={send} disabled={!ready || busy !== ""} className="btn-gold px-5 py-2.5 rounded text-sm font-semibold disabled:opacity-50">
          {busy === "send" ? "Sending…" : personal ? "Send" : audience ? `Send to ${audience.count} ${audience.count === 1 ? "person" : "people"}` : "Send"}
        </button>
        {!tested && ready && <span className="text-xs text-cream-400">Tip: send yourself a test first.</span>}
      </div>
      <p className="text-xs text-cream-400">
        Sent from RIHOSO &lt;membership@rihoso.com&gt;. Replies go to the membership@rihoso.com inbox. Each person gets their
        own copy — nobody sees anyone else&apos;s address.
      </p>
    </div>
  );
}
