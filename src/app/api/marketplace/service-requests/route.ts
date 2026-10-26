import { NextResponse } from "next/server";
import { clean, sendNotification } from "@/lib/email";
import { SERVICES } from "@/lib/marketplace";
import { UserError } from "@/lib/orders";
import { startServiceCheckout } from "@/lib/services";
import { siteUrl } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Creates a service request.
 *  - validation: $100 paid up front → returns a Stripe Checkout URL
 *  - repair: recorded and sent to RIHOSO, who replies with a quote to pay
 */
export async function POST(request: Request) {
  const { supabase, user } = await getUser();
  if (!user?.email) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const type = data.type === "repair" ? "repair" : data.type === "validation" ? "validation" : null;
  const listingId = clean(data.listingId, 40) || null;
  const description = clean(data.description, 4000);
  if (!type) return NextResponse.json({ error: "Unknown request type." }, { status: 400 });
  if (type === "validation" && !listingId) return NextResponse.json({ error: "Missing listing." }, { status: 400 });
  if (type === "repair" && description.length < 10) {
    return NextResponse.json({ error: "Please describe the watch and what it needs." }, { status: 400 });
  }

  let listingTitle = "";
  if (listingId) {
    // Visibility check runs as the user, so they can only reference listings they can see.
    const { data: listing } = await supabase.from("listings").select("id, title, validation_status").eq("id", listingId).maybeSingle();
    if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    if (type === "validation" && listing.validation_status !== "none") {
      return NextResponse.json({ error: "This watch already has a validation underway or completed." }, { status: 409 });
    }
    listingTitle = listing.title;
  }

  const admin = createAdminClient();
  const base = siteUrl(request);
  try {
    if (type === "validation") {
      // Reuse this person's unpaid validation request for the same watch if they come back.
      const { data: existing } = await admin
        .from("service_requests")
        .select("id")
        .eq("type", "validation")
        .eq("requester_id", user.id)
        .eq("listing_id", listingId)
        .eq("status", "awaiting_payment")
        .maybeSingle();
      let id = existing?.id as string | undefined;
      if (!id) {
        const { data: created, error } = await admin
          .from("service_requests")
          .insert({
            type,
            requester_id: user.id,
            listing_id: listingId,
            description: description || `Member validation of “${listingTitle}”`,
            status: "awaiting_payment",
            price_cents: SERVICES.validation.priceCents,
          })
          .select("id")
          .single();
        if (error) throw error;
        id = created.id as string;
      }
      const url = await startServiceCheckout(id, user.id, base);
      return NextResponse.json({ ok: true, id, url });
    }

    const { data: created, error } = await admin
      .from("service_requests")
      .insert({ type, requester_id: user.id, listing_id: listingId, description })
      .select("id")
      .single();
    if (error) throw error;
    await sendNotification({
      subject: "New repair quote request",
      replyTo: user.email,
      rows: [
        ["Requested by", user.email],
        ["Details", description],
        ["Send a quote", `${base}/marketplace/admin`],
      ],
    });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (err) {
    if (err instanceof UserError) return NextResponse.json({ error: err.message }, { status: 409 });
    console.error("[service-requests] failed", err);
    return NextResponse.json({ error: "Couldn't send the request. Please try again." }, { status: 502 });
  }
}
