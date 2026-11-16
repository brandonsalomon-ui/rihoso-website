import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PageHero from "@/components/PageHero";
import JobStatusButtons from "@/components/partners/JobStatusButtons";
import PartnerQuoteForm from "@/components/partners/PartnerQuoteForm";
import { contactMethodLabel, formatUsd } from "@/lib/marketplace";
import { jobStatusLabel } from "@/lib/repair-partner-rules";
import { fmtWhen, getPartnerForUser, type RepairQuote } from "@/lib/repair-partners";
import { getServiceRequest, repairPhotoUrls, repairWatchName } from "@/lib/services";
import { createAdminClient, getUserEmail } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Repair Request", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PartnerRequestPage({ params }: { params: { id: string } }) {
  const { user } = await getUser();
  if (!user) redirect(`/marketplace/sign-in?next=/partner/requests/${params.id}`);
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const partner = await getPartnerForUser(user.id);
  if (!partner) notFound();
  // Only workshops the customer chose to send this request to can see it.
  const { data: q } = await createAdminClient()
    .from("repair_quotes")
    .select("id, request_id, partner_id, status, price_cents, includes, turnaround, warranty, dropoff, notes, quoted_at, selected_at, job_status, fee_cents, fee_paid_at, created_at")
    .eq("request_id", params.id)
    .eq("partner_id", partner.id)
    .maybeSingle();
  const quote = q as RepairQuote | null;
  if (!quote) notFound();
  const req = await getServiceRequest(params.id);
  if (!req) notFound();

  const watch = repairWatchName(req) || "Watch repair";
  const photos = await repairPhotoUrls(req.photo_paths).catch(() => [] as string[]);
  const chosen = quote.status === "selected";
  const canQuote = ["invited", "quoted", "declined"].includes(quote.status) && req.status !== "cancelled" && partner.status === "active";
  const customerEmail = chosen ? await getUserEmail(req.requester_id) : null;

  return (
    <>
      <PageHero eyebrow={partner.business_name} title={watch} />
      <section className="py-12 bg-forest-800 min-h-[60vh]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Link href="/partner" className="text-sm text-gold-400 hover:text-gold-300">← Dashboard</Link>

          {chosen && (
            <div className="panel-lux rounded-xl p-6 space-y-3 border border-gold-400/50">
              <p className="text-xs uppercase tracking-widest text-gold-400">You were chosen</p>
              <p className="text-cream-50 text-lg">
                {req.contact_name} · prefers {req.contact_method ? contactMethodLabel(req.contact_method).toLowerCase() : "email"}
              </p>
              <p className="text-cream-200">
                {customerEmail && (
                  <a href={`mailto:${customerEmail}`} className="hover:text-gold-300">{customerEmail}</a>
                )}
                {req.contact_phone && (
                  <>
                    {" · "}
                    <a href={`tel:${req.contact_phone.replace(/[^\d+]/g, "")}`} className="hover:text-gold-300">{req.contact_phone}</a>
                  </>
                )}
              </p>
              <p className="text-sm text-cream-300">
                Your price {formatUsd(quote.price_cents ?? 0)} · RIHOSO referral fee {formatUsd(quote.fee_cents ?? 0)}
                {quote.fee_paid_at ? " (paid)" : ""} · status: <strong className="text-cream-100">{jobStatusLabel(quote.job_status)}</strong>
              </p>
              <JobStatusButtons requestId={req.id} current={quote.job_status} />
            </div>
          )}

          <div className="panel-lux rounded-xl p-6 space-y-3">
            <p className="text-xs uppercase tracking-widest text-gold-400">The request</p>
            <p className="text-cream-100 whitespace-pre-line">{req.description}</p>
            <p className="text-sm text-cream-400">
              Received {fmtWhen(req.created_at)}
              {req.quotes_due_at && !chosen ? ` · please quote by ${fmtWhen(req.quotes_due_at)}` : ""}
            </p>
            {photos.length ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                {photos.map((u, i) => (
                  <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded overflow-hidden bg-forest-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt={`Photo ${i + 1} of the watch`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          {canQuote ? (
            <div className="panel-lux rounded-xl p-6 sm:p-8">
              <h2 className="font-display text-2xl text-cream-50 mb-1">{quote.status === "quoted" ? "Your quote" : "Send your quote"}</h2>
              <p className="text-sm text-cream-400 mb-5">
                The customer sees every workshop&apos;s quote side by side. You get their contact details if they choose you.
                {quote.status === "declined" ? " You declined this request; you can still quote if you change your mind." : ""}
              </p>
              <PartnerQuoteForm requestId={req.id} existing={quote.status === "quoted" ? quote : null} />
            </div>
          ) : !chosen ? (
            <div className="panel-lux rounded-xl p-6 text-cream-300">
              {quote.status === "not_selected"
                ? "The customer chose another workshop for this request."
                : req.status === "cancelled"
                  ? "This request was cancelled."
                  : partner.status !== "active"
                    ? "Your partnership isn't active, so you can't quote right now."
                    : "This request is closed."}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
