import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import ExchangeNav from "@/components/exchange/ExchangeNav";
import PayServiceButton from "@/components/exchange/PayServiceButton";
import { SERVICES, formatUsd } from "@/lib/marketplace";
import { isAdmin } from "@/lib/orders";
import { finalizeServiceCheckout, getServiceRequest } from "@/lib/services";
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

  return (
    <>
      <ExchangeNav signedIn />
      <section className="py-12 bg-forest-800 min-h-[60vh]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <p className="text-gold-400 text-xs uppercase tracking-[0.2em]">RIHOSO service</p>
            <h1 className="font-display text-3xl text-cream-50">{name}</h1>
            {listing && (
              <Link href={`/marketplace/listings/${listing.id}`} className="text-cream-300 hover:text-gold-300">
                {listing.title}
              </Link>
            )}
          </div>

          <div className="panel-lux rounded-xl p-6 space-y-3">
            <p className="text-cream-100">
              Status: <span className="text-gold-300 font-semibold">{STATUS[req.status] ?? req.status}</span>
            </p>
            {req.price_cents ? <p className="text-cream-200">Price: {formatUsd(req.price_cents)}</p> : null}
            {req.description && <p className="text-sm text-cream-300 whitespace-pre-line">{req.description}</p>}
            {req.result_notes && (
              <p className="text-sm text-cream-100 whitespace-pre-line border-l-2 border-gold-400 pl-3">{req.result_notes}</p>
            )}
            {req.refunded_at && <p className="text-sm text-cream-300">Refunded.</p>}
            {req.status === "awaiting_payment" && req.price_cents && req.requester_id === user.id && (
              <PayServiceButton id={req.id} label={`Pay ${formatUsd(req.price_cents)}`} />
            )}
          </div>
          <p className="text-xs text-cream-400 leading-relaxed">
            Member validations are an expert opinion from an experienced RIHOSO member, not a warranty of authenticity.
            Repairs are quoted in writing before any work begins.
          </p>
        </div>
      </section>
    </>
  );
}
