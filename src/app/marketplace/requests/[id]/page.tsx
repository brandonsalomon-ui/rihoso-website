import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import ExchangeNav from "@/components/exchange/ExchangeNav";
import PayServiceButton from "@/components/exchange/PayServiceButton";
import ChooseQuoteButton from "@/components/partners/ChooseQuoteButton";
import { jobStatusLabel } from "@/lib/repair-partner-rules";
import { fmtWhen, quotesForRequest } from "@/lib/repair-partners";
import { SERVICES, contactMethodLabel, formatUsd } from "@/lib/marketplace";
import { isAdmin } from "@/lib/orders";
import { finalizeServiceCheckout, getServiceRequest, repairPhotoUrls, repairWatchName } from "@/lib/services";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Service Request", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  requested: "Waiting for RIHOSO's quote",
  awaiting_payment: "Ready for payment",
  paid: "Paid — RIHOSO will be in touch",
  in_progress: "In progress",
  complete: "Complete",
  cancelled: "Cancelled",
};

export default async function RequestPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { session_id?: string };
}) {
  const { user } = await getUser();
  if (!user) redirect(`/marketplace/sign-in?next=/marketplace/requests/${params.id}`);
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();

  if (searchParams.session_id?.startsWith("cs_")) {
    try {
      const host = headers().get("x-forwarded-host") ?? headers().get("host");
      await finalizeServiceCheckout(searchParams.session_id, process.env.NEXT_PUBLIC_SITE_URL || `https://${host}`);
    } catch (err) {
      console.error("[requests] finalize failed", err);
    }
    redirect(`/marketplace/requests/${params.id}`);
  }

  const req = await getServiceRequest(params.id);
  if (!req) notFound();
  if (req.requester_id !== user.id && !(await isAdmin(user.id))) notFound();
  const { data: listing } = req.listing_id
    ? await createAdminClient().from("listings").select("id, title").eq("id", req.listing_id).maybeSingle()
    : { data: null };
  const name = req.type === "validation" ? SERVICES.validation.name : SERVICES.repair.name;
  const watch = repairWatchName(req);
  const photos = await repairPhotoUrls(req.photo_paths).catch(() => [] as string[]);
  const quotes = req.partner_mode ? await quotesForRequest(req.id).catch(() => []) : [];
  const offered = quotes.filter((q) => q.status === "quoted");
  const chosen = quotes.find((q) => q.status === "selected");
  const waiting = quotes.filter((q) => q.status === "invited").length;
  const isOwner = req.requester_id === user.id;
  const statusText = !req.partner_mode
    ? STATUS[req.status] ?? req.status
    : req.status === "cancelled"
      ? "Cancelled"
      : chosen
        ? `With ${chosen.repair_partners?.business_name ?? "your workshop"} — ${jobStatusLabel(chosen.job_status)}`
        : offered.length
          ? `${offered.length} quote${offered.length === 1 ? "" : "s"} ready — choose a workshop`
          : "Waiting for workshop quotes";

  return (
    <>
      <ExchangeNav signedIn />
      <section className="py-12 bg-forest-800 min-h-[60vh]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <p className="text-gold-400 text-xs uppercase tracking-[0.2em]">RIHOSO service</p>
            <h1 className="font-display text-3xl text-cream-50">{name}</h1>
            {watch && <p className="text-cream-200 mt-1">{watch}</p>}
            {listing && (
              <Link href={`/marketplace/listings/${listing.id}`} className="text-cream-300 hover:text-gold-300">
                {listing.title}
              </Link>
            )}
          </div>

          <div className="panel-lux rounded-xl p-6 space-y-3">
            <p className="text-cream-100">
              Status: <span className="text-gold-300 font-semibold">{statusText}</span>
            </p>
            {req.price_cents ? <p className="text-cream-200">Price: {formatUsd(req.price_cents)}</p> : null}
            {req.contact_method && !req.partner_mode && (
              <p className="text-sm text-cream-300">
                We&apos;ll reach you by <span className="text-cream-100">{contactMethodLabel(req.contact_method).toLowerCase()}</span>
                {req.contact_method !== "email" && req.contact_phone ? ` at ${req.contact_phone}` : ""}.
              </p>
            )}
            {req.description && <p className="text-sm text-cream-300 whitespace-pre-line">{req.description}</p>}
            {photos.length ? (
              <div className="grid grid-cols-4 gap-2 pt-1">
                {photos.map((u, i) => (
                  <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded overflow-hidden bg-forest-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt={`Photo ${i + 1} of your watch`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            ) : null}
            {req.result_notes && !req.partner_mode && (
              <p className="text-sm text-cream-100 whitespace-pre-line border-l-2 border-gold-400 pl-3">{req.result_notes}</p>
            )}
            {req.refunded_at && <p className="text-sm text-cream-300">Refunded.</p>}
            {req.status === "awaiting_payment" && req.price_cents && req.requester_id === user.id && (
              <PayServiceButton id={req.id} label={`Pay ${formatUsd(req.price_cents)}`} />
            )}
          </div>
          {req.partner_mode && req.status !== "cancelled" && (
            <div className="space-y-4">
              {chosen ? (
                <div className="panel-lux rounded-xl p-6 space-y-2 border border-gold-400/50">
                  <p className="text-xs uppercase tracking-widest text-gold-400">Your workshop</p>
                  <p className="font-display text-2xl text-cream-50">{chosen.repair_partners?.business_name}</p>
                  <p className="text-cream-200">
                    {formatUsd(chosen.price_cents ?? 0)} · {chosen.turnaround}
                    {chosen.warranty ? ` · ${chosen.warranty} warranty` : ""}
                  </p>
                  {chosen.repair_partners?.city && <p className="text-sm text-cream-300">{chosen.repair_partners.city}</p>}
                  <p className="text-sm text-cream-400">
                    They&apos;ll contact you to arrange drop-off or shipping. Progress: {jobStatusLabel(chosen.job_status)}. Questions? Email{" "}
                    <a href="mailto:membership@rihoso.com" className="text-gold-400 hover:text-gold-300">membership@rihoso.com</a>.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="font-display text-2xl text-cream-50">Compare quotes</h2>
                  <p className="text-sm text-cream-300">
                    {waiting > 0
                      ? `${waiting} workshop${waiting === 1 ? " is" : "s are"} still reviewing your request${req.quotes_due_at ? ` (quotes requested by ${fmtWhen(req.quotes_due_at)})` : ""}. We'll email you as each quote arrives.`
                      : offered.length
                        ? "All quotes are in."
                        : "No quotes yet."}{" "}
                    Only the workshop you choose receives your contact details.
                  </p>
                  {offered.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {offered
                        .slice()
                        .sort((a, b) => (a.price_cents ?? 0) - (b.price_cents ?? 0))
                        .map((q) => (
                          <div key={q.id} className="card-lux rounded-xl p-5 flex flex-col gap-3">
                            <div>
                              <p className="text-cream-50 font-display text-xl">{q.repair_partners?.business_name}</p>
                              {q.repair_partners?.city && <p className="text-xs text-cream-400">{q.repair_partners.city}</p>}
                            </div>
                            <p className="font-display text-3xl text-gold-foil">{formatUsd(q.price_cents ?? 0)}</p>
                            <dl className="text-sm space-y-1">
                              <div><dt className="inline text-cream-400">Turnaround: </dt><dd className="inline text-cream-100">{q.turnaround}</dd></div>
                              <div><dt className="inline text-cream-400">Warranty: </dt><dd className="inline text-cream-100">{q.warranty || "—"}</dd></div>
                              <div><dt className="inline text-cream-400">Drop-off: </dt><dd className="inline text-cream-100">{q.dropoff ? "Yes" : "Ship only"}</dd></div>
                            </dl>
                            <p className="text-sm text-cream-200 whitespace-pre-line">{q.includes}</p>
                            {q.notes && <p className="text-sm text-cream-300 whitespace-pre-line border-l-2 border-gold-400/50 pl-3">{q.notes}</p>}
                            {isOwner && (
                              <div className="mt-auto pt-2">
                                <ChooseQuoteButton quoteId={q.id} shop={q.repair_partners?.business_name ?? "this workshop"} price={formatUsd(q.price_cents ?? 0)} />
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <p className="text-xs text-cream-400 leading-relaxed">
            Repairs are quoted in writing before any work begins, and nothing beyond the quote is done without your approval.
          </p>
        </div>
      </section>
    </>
  );
}
