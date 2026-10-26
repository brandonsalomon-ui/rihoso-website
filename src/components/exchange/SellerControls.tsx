"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ListingStatus } from "@/lib/exchange-types";
import { createClient } from "@/lib/supabase/browser";

export default function SellerControls({
  listingId,
  status,
}: {
  listingId: string;
  status: ListingStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function setStatus(next: ListingStatus) {
    setBusy(true);
    setError("");
    const { error } = await createClient().from("listings").update({ status: next }).eq("id", listingId);
    if (error) setError(/required to publish/.test(error.message) ? error.message : next === "active" ? "Finish your seller setup before publishing." : error.message);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="panel-lux rounded-xl p-5 space-y-3">
      <p className="text-sm text-cream-300">This is your listing.</p>
      <div className="flex flex-wrap gap-3">
        {(status === "draft" || status === "withdrawn") && (
          <button disabled={busy} onClick={() => setStatus("active")} className="btn-gold px-5 py-2 rounded font-semibold disabled:opacity-60">
            Publish
          </button>
        )}
        {status === "active" && (
          <button
            disabled={busy}
            onClick={() => setStatus("withdrawn")}
            className="px-5 py-2 rounded border border-cream-200/30 text-cream-100 hover:border-gold-400 disabled:opacity-60"
          >
            Withdraw listing
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
    </div>
  );
}
