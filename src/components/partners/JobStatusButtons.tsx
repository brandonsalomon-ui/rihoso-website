"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { JOB_STATUSES, type JobStatus } from "@/lib/repair-partner-rules";

/** Partner: move a chosen job forward. Each step emails the customer. */
export default function JobStatusButtons({ requestId, current }: { requestId: string; current: JobStatus | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const idx = JOB_STATUSES.findIndex((j) => j.value === current);
  const next = JOB_STATUSES.slice(Math.max(idx + 1, 1));

  async function set(jobStatus: JobStatus) {
    if (jobStatus === "complete" && !confirm("Mark this repair complete and returned to the customer?")) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/partner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "job", requestId, jobStatus }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setError(json.error || "Something went wrong.");
    else router.refresh();
  }

  if (current === "complete") return <p className="text-sm text-green-300">Complete.</p>;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {next.map((j, i) => (
          <button key={j.value} disabled={busy} onClick={() => set(j.value)}
            className={`px-4 py-2 rounded text-sm font-semibold disabled:opacity-60 ${
              i === 0 ? "btn-gold" : "border border-cream-200/30 text-cream-100 hover:border-gold-400"
            }`}>
            {j.label}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
