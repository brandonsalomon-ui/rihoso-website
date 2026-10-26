import { NextResponse } from "next/server";
import { clean, sendNotification } from "@/lib/email";
import { REPAIRS_OPEN } from "@/lib/marketplace";
import { UserError } from "@/lib/orders";
import { siteUrl } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Creates a repair request. It's recorded and sent to RIHOSO, who replies with a quote to pay.
 * (Paid member validation was retired; old validation requests are kept for the record only.)
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
  if (data.type === "validation") {
    return NextResponse.json({ error: "Member validation is no longer offered." }, { status: 410 });
  }
  if (data.type !== "repair") return NextResponse.json({ error: "Unknown request type." }, { status: 400 });
  if (!REPAIRS_OPEN) return NextResponse.json({ error: "Repair requests aren't open yet." }, { status: 503 });
  const type = "repair" as const;
  const listingId = clean(data.listingId, 40) || null;
  const description = clean(data.description, 4000);
  if (description.length < 10) {
    return NextResponse.json({ error: "Please describe the watch and what it needs." }, { status: 400 });
  }
  if (listingId) {
    // Visibility check runs as the user, so they can only reference listings they can see.
    const { data: listing } = await supabase.from("listings").select("id").eq("id", listingId).maybeSingle();
    if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const admin = createAdminClient();
  const base = siteUrl(request);
  try {
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
