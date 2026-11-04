"use client";

import { useMemo, useState } from "react";
import AdminButton from "@/components/exchange/AdminButton";

export type DirectoryRow = {
  userId: string | null;
  /** Has a paid online membership, so the welcome letter can be (re)sent. */
  canWelcome: boolean;
  email: string;
  name: string;
  phone: string;
  status: "active" | "approved" | "expired" | "account" | "rsvp";
  statusLabel: string;
  since: string;
  memberUntil: string;
  events: string[];
  unsubscribed: boolean;
};

const VIEWS = [
  { id: "members", label: "Members", match: (r: DirectoryRow) => r.status === "active" || r.status === "approved" },
  { id: "expired", label: "Ended", match: (r: DirectoryRow) => r.status === "expired" },
  { id: "others", label: "Accounts & RSVPs", match: (r: DirectoryRow) => r.status === "account" || r.status === "rsvp" },
  { id: "all", label: "Everyone", match: () => true },
] as const;

const STATUS_COLOR: Record<DirectoryRow["status"], string> = {
  active: "text-gold-300",
  approved: "text-gold-300",
  expired: "text-cream-400",
  account: "text-cream-300",
  rsvp: "text-cream-300",
};

/** Searchable member list with a CSV download. */
export default function MemberDirectory({ rows }: { rows: DirectoryRow[] }) {
  const [view, setView] = useState<(typeof VIEWS)[number]["id"]>("members");
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const v = VIEWS.find((x) => x.id === view)!;
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (r) => v.match(r) && (!needle || `${r.name} ${r.email} ${r.phone}`.toLowerCase().includes(needle))
    );
  }, [rows, view, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {VIEWS.map((v) => {
          const n = rows.filter(v.match).length;
          return (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-3 py-1.5 rounded text-sm border ${
                view === v.id ? "border-gold-400 text-gold-200 bg-forest-700/40" : "border-cream-200/20 text-cream-300 hover:border-gold-400/60"
              }`}
            >
              {v.label} <span className="text-cream-400">({n})</span>
            </button>
          );
        })}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, phone"
          className="ml-auto w-full sm:w-64 bg-forest-950/60 border border-forest-600/50 rounded px-3 py-1.5 text-sm text-cream-100 placeholder-cream-400 focus:outline-none focus:border-gold-400/60"
        />
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <a href="/api/marketplace/admin/members-csv?view=members" className="text-gold-300 hover:underline">
          Download members (CSV)
        </a>
        <span className="text-cream-400">·</span>
        <a href="/api/marketplace/admin/members-csv?view=everyone" className="text-gold-300 hover:underline">
          Download everyone (CSV)
        </a>
      </div>

      {shown.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-cream-400">
              <tr>
                <th className="py-2 pr-4 font-normal">Name</th>
                <th className="py-2 pr-4 font-normal">Email · phone</th>
                <th className="py-2 pr-4 font-normal">Status</th>
                <th className="py-2 pr-4 font-normal">Since</th>
                <th className="py-2 pr-4 font-normal">Member until</th>
                <th className="py-2 font-normal" />
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-600/30">
              {shown.map((r) => (
                <tr key={r.email}>
                  <td className="py-2 pr-4 text-cream-100">{r.name || <span className="text-cream-400">—</span>}</td>
                  <td className="py-2 pr-4 text-cream-300">
                    <a href={`mailto:${r.email}`} className="hover:text-gold-300 break-all">{r.email}</a>
                    {r.phone && <span className="block text-xs">{r.phone}</span>}
                    {r.unsubscribed && <span className="block text-xs text-red-300">Unsubscribed from announcements</span>}
                  </td>
                  <td className={`py-2 pr-4 ${STATUS_COLOR[r.status]}`}>
                    {r.statusLabel}
                    {r.events.length > 0 && <span className="block text-xs text-cream-400">RSVP: {r.events.join(", ")}</span>}
                  </td>
                  <td className="py-2 pr-4 text-cream-300 whitespace-nowrap">{r.since || "—"}</td>
                  <td className="py-2 pr-4 text-cream-300 whitespace-nowrap">{r.memberUntil || "—"}</td>
                  <td className="py-2 text-right">
                    {r.canWelcome && r.userId && (
                      <AdminButton
                        label="Send welcome letter"
                        body={{ action: "send_welcome", id: r.userId }}
                        confirmText={`Send the welcome letter to ${r.name || r.email}? You'll get a blind copy.`}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-cream-400 text-sm">Nobody here{q ? " matches that search" : " yet"}.</p>
      )}
    </div>
  );
}
