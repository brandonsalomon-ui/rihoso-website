import { NextResponse } from "next/server";
import { EVENTS } from "@/lib/events";
import { isMember, loadDirectory, STATUS_LABEL } from "@/lib/member-mail";
import { isAdmin } from "@/lib/orders";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cell(v: string) {
  // Quote every cell; neutralise leading characters spreadsheets treat as formulas.
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }) : "";

/** Admin only: the member list as a CSV for Excel / Google Sheets. ?view=members (default) or ?view=everyone */
export async function GET(request: Request) {
  const { user } = await getUser();
  if (!user || !(await isAdmin(user.id))) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const view = new URL(request.url).searchParams.get("view") === "everyone" ? "everyone" : "members";
  const people = (await loadDirectory()).filter((p) => view === "everyone" || isMember(p) || p.status === "expired");
  const eventName = new Map(EVENTS.filter((e) => e.rsvp).map((e) => [e.rsvp!.slug, e.shortTitle || e.title]));

  const rows = [
    ["Name", "Email", "Phone", "Status", "Since", "Member until", "Site account", "Event RSVPs", "Unsubscribed"],
    ...people.map((p) => [
      p.name,
      p.email,
      p.phone,
      STATUS_LABEL[p.status],
      day(p.since),
      day(p.memberUntil),
      p.hasAccount ? "Yes" : "No",
      p.events.map((s) => eventName.get(s) ?? s).join("; "),
      p.unsubscribed ? "Yes" : "",
    ]),
  ];
  const csv = "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
  const stamp = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rihoso-${view}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
