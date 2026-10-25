"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { inputClass } from "./SignInForm";

export default function DisplayNameForm({ userId, initial }: { userId: string; initial: string }) {
  const [saved, setSaved] = useState("");
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = String(new FormData(e.currentTarget).get("display_name") ?? "").trim();
    if (!name) return;
    const { error } = await createClient().from("profiles").update({ display_name: name }).eq("id", userId);
    setSaved(error ? "Couldn't save." : "Saved.");
  }
  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:items-end">
      <div className="flex-1">
        <label htmlFor="dn" className="block text-sm text-cream-200 mb-1">Name shown to other members</label>
        <input id="dn" name="display_name" defaultValue={initial} maxLength={80} required className={inputClass} />
      </div>
      <button className="px-5 py-3 rounded border border-gold-400/40 text-gold-200 hover:bg-gold-400/10">Save</button>
      {saved && <span className="text-sm text-cream-300" role="status">{saved}</span>}
    </form>
  );
}
