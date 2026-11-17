import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PageHero from "@/components/PageHero";
import { formatUsd } from "@/lib/marketplace";
import { formatDate } from "@/lib/memberships";
import { RENEW_WINDOW_DAYS, jobStatusLabel } from "@/lib/repair-partner-rules";
import { canPay, fmtWhen, getPartnerForUser, quotesForPartner, type RepairQuote } from "@/lib/repair-partners";
import { repairWatchName, type ServiceRequest } from "@/lib/services";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Repair Partner Dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

type Row = RepairQuote & { req: Pick<ServiceRequest, "id" | "status" | "created_at" | "quotes_due_at" | "watch_brand" | "watch_model" | "watch_reference" | "watch_year" | "description"> | null };

function List({ title, rows, empty, note }: { title: string; rows: Row[]; empty: string; note?: (r: Row) => string }) {
  return (
    <div className="panel-lux rounded-xl p-6 sm:p-8">
      <h2 className="font-display text-2xl text-cream-50 mb-4">
        {title} <span className="text-gold-400 text-lg">({rows.length})</span>
      </h2>
      {rows.length ? (
        <ul className="divide-y divide-forest-600/30">
          {rows.map((r) => (
            <li key={r.id} className="py-3">
              <Link href={`/partner/requests/${r.request_id}`} className="flex flex-wrap items-center justify-between gap-2 group">
                <span>
                  <span className="text-cream-50 group-hover:text-gold-300">{r.req ? repairWatchName(r.req) || "Watch repair" : "Watch repair"}</span>
                  {r.req?.description && <span className="block text-sm text-cream-400 line-clamp-1">{r.req.description}</span>}
                </span>
                <span className="text-sm text-cream-300">{note ? note(r) : ""} →</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-cream-400">{empty}</p>
      )}
    </div>
  );
}

export default async function PartnerDashboard() {
  const { user } = await getUser();
  if (!user) redirect("/marketplace/sign-in?next=/partner");
  const partner = await getPartnerForUser(user.id);
  if (!partner || partner.status === "pending_payment") redirect("/repair-partners#join");

  const quotes = await quotesForPartner(partner.id);
  const ids = Array.from(new Set(quotes.map((q) => q.request_id)));
  const { data: reqs } = ids.length
    ? await createAdminClient()
        .from("service_requests")
        .select("id, status, created_at, quotes_due_at, watch_brand, watch_model, watch_reference, watch_year, description")
        .in("id", ids)
    : { data: [] };
  const byId = new Map((reqs ?? []).map((r) => [r.id as string, r as Row["req"]]));
  const rows: Row[] = quotes.map((q) => ({ ...q, req: byId.get(q.request_id) ?? null }));
  const open = rows.filter((r) => r.status === "invited" && r.req?.status !== "cancelled");
  const quoted = rows.filter((r) => r.status === "quoted" && r.req?.status !== "cancelled");
  const jobs = rows.filter((r) => r.status === "selected");
  const closed = rows.filter((r) => ["declined", "not_selected", "cancelled"].includes(r.status) || r.req?.status === "cancelled").slice(0, 20);
  const feesOwed = jobs.filter((j) => !j.fee_paid_at).reduce((n, j) => n + (j.fee_cents ?? 0), 0);
  const renewSoon = (partner.status === "active" || partner.status === "inactive") && canPay(partner);

  return (
    <>
      <PageHero eyebrow="RIHOSO Repair Partner" title={partner.business_name} />
      <section className="py-12 bg-forest-800 min-h-[60vh]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="panel-lux rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="text-cream-200">
              {partner.status === "pending_approval" && <p>Your application is paid and waiting for RIHOSO&apos;s approval. Leads start once you&apos;re approved.</p>}
              {partner.status === "active" && partner.period_end && <p>Active partner through <strong className="text-cream-50">{formatDate(partner.period_end)}</strong>.</p>}
              {partner.status === "inactive" && <p>Your partnership is paused by RIHOSO, so new leads aren&apos;t being sent. Questions: membership@rihoso.com.</p>}
              {partner.status === "active" && partner.period_end && new Date(partner.period_end) < new Date() && <p>Your partnership year has ended. Renew to keep receiving leads.</p>}
              {partner.status === "declined" && <p>Your application wasn&apos;t approved. You&apos;re welcome to contact RIHOSO at membership@rihoso.com.</p>}
              <p className="text-sm text-cream-400 mt-1">Leads arrive by email at {user.email}. Referral fees outstanding: {formatUsd(feesOwed)}.</p>
            </div>
            {renewSoon && (
              <Link href="/repair-partners#join" className="btn-gold px-6 py-2 rounded font-semibold">
                Renew partnership
              </Link>
            )}
          </div>
          {renewSoon && (
            <p className="text-sm text-cream-400 -mt-4">Renewal is open: your year ends within {RENEW_WINDOW_DAYS} days.</p>
          )}

          <List title="New requests to quote" rows={open} empty="No new requests right now — we'll email you when one arrives."
            note={(r) => (r.req?.quotes_due_at ? `Quote by ${fmtWhen(r.req.quotes_due_at)}` : "")} />
          <List title="Quotes sent — waiting for the customer" rows={quoted} empty="No quotes waiting."
            note={(r) => (r.price_cents ? formatUsd(r.price_cents) : "")} />
          <List title="Your jobs" rows={jobs} empty="No jobs yet."
            note={(r) => `${formatUsd(r.price_cents ?? 0)} · ${jobStatusLabel(r.job_status)}`} />
          {closed.length > 0 && (
            <List title="Closed" rows={closed} empty=""
              note={(r) => (r.status === "declined" ? "You declined" : r.status === "not_selected" ? "Another workshop was chosen" : "Cancelled")} />
          )}
        </div>
      </section>
    </>
  );
}
