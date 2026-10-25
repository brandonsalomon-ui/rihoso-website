import { NextResponse } from "next/server";
import { clean, sendNotification } from "@/lib/email";
import { SERVICES, formatUsd } from "@/lib/marketplace";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/stripe";

export const runtime = "nodejs";

/** Records a member-validation or repair request and notifies RIHOSO. Payment is arranged after review. */
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
      return NextResponse.json({ error: "A validation has already been requested for this watch." }, { status: 409 });
    }
    listingTitle = listing.title;
  }

  try {
    const admin = createAdminClient();
    const { data: req, error } = await admin
      .from("service_requests")
      .insert({
        type,
        requester_id: user.id,
        listing_id: listingId,
        description,
        price_cents: type === "validation" ? SERVICES.validation.priceCents : null,
      })
      .select("id")
      .single();
    if (error) throw error;
    if (type === "validation" && listingId) {
      await admin.from("listings").update({ validation_status: "requested" }).eq("id", listingId);
    }

    await sendNotification({
      subject: type === "validation" ? `Validation request: ${listingTitle}` : "New repair quote request",
      replyTo: user.email,
      rows: [
        ["Type", type === "validation" ? `Member validation (${formatUsd(SERVICES.validation.priceCents)})` : "Repair / service quote"],
        ["Requested by", user.email],
        ["Listing", listingId ? `${listingTitle} — ${siteUrl(request)}/marketplace/listings/${listingId}` : "—"],
        ["Details", description],
        ["Request ID", req.id],
      ],
    });
    return NextResponse.json({ ok: true, id: req.id });
  } catch (err) {
    console.error("[service-requests] failed", err);
    return NextResponse.json({ error: "Couldn't send the request. Please try again." }, { status: 502 });
  }
}
