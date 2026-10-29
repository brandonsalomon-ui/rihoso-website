import { NextResponse } from "next/server";
import { clean, sendMemberEmail, sendNotification } from "@/lib/email";
import { CONTACT_METHODS, REPAIRS_OPEN, REPAIR_RULES, contactMethodLabel, type ContactMethod } from "@/lib/marketplace";
import { UserError } from "@/lib/orders";
import { repairPhotoUrls, repairWatchName } from "@/lib/services";
import { siteUrl } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Links in the notification email stay valid this long (RIHOSO may answer a few days later). */
const EMAIL_PHOTO_LINK_SECONDS = 30 * 24 * 60 * 60;

/**
 * Creates a repair request: watch details, the customer's description of the issue, photos and how
 * they'd like to be contacted. It's recorded and emailed to RIHOSO, who replies with a price or a call.
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

  const listingId = clean(data.listingId, 40) || null;
  const description = clean(data.description, 4000);
  const contactName = clean(data.contactName, 120);
  const contactPhone = clean(data.contactPhone, 40);
  const methodRaw = clean(data.contactMethod, 10);
  const contactMethod = (CONTACT_METHODS.some((m) => m.value === methodRaw) ? methodRaw : "email") as ContactMethod;
  const watchBrand = clean(data.watchBrand, 60);
  const watchModel = clean(data.watchModel, 80) || null;
  const watchReference = clean(data.watchReference, 60) || null;
  const yearNum = typeof data.watchYear === "number" ? Math.trunc(data.watchYear) : NaN;
  const watchYear = yearNum >= 1700 && yearNum <= 2100 ? yearNum : null;
  // Photos must have been uploaded by this user, into their own folder of the private repair bucket.
  const photoPaths = Array.isArray(data.photoPaths)
    ? data.photoPaths
        .filter((p): p is string => typeof p === "string")
        .filter((p) => p.startsWith(`${user.id}/`) && /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/\d{1,2}\.[a-z]{3,4}$/i.test(p))
        .slice(0, REPAIR_RULES.maxPhotos)
    : [];

  const problems: string[] = [];
  if (!contactName) problems.push("your name");
  if (!watchBrand) problems.push("the watch brand");
  if (description.length < REPAIR_RULES.minIssue) problems.push("a description of the issue");
  if (photoPaths.length < REPAIR_RULES.minPhotos) problems.push("at least one photo");
  if (contactMethod !== "email" && contactPhone.replace(/\D/g, "").length < 7) problems.push("a phone number to call or text");
  if (problems.length) return NextResponse.json({ error: `Please add ${problems.join(", ")}.` }, { status: 400 });

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
      .insert({
        type: "repair",
        requester_id: user.id,
        listing_id: listingId,
        description,
        contact_name: contactName,
        contact_phone: contactPhone || null,
        contact_method: contactMethod,
        watch_brand: watchBrand,
        watch_model: watchModel,
        watch_reference: watchReference,
        watch_year: watchYear,
        photo_paths: photoPaths,
      })
      .select("id")
      .single();
    if (error) throw error;

    const watch = repairWatchName({ watch_brand: watchBrand, watch_model: watchModel, watch_reference: watchReference, watch_year: watchYear });
    const method = contactMethodLabel(contactMethod);
    const photoLinks = await repairPhotoUrls(photoPaths, EMAIL_PHOTO_LINK_SECONDS).catch(() => [] as string[]);

    const notified = await sendNotification({
      subject: `Repair request: ${watch} — ${contactName} prefers ${method.toLowerCase()}`,
      replyTo: user.email,
      rows: [
        ["Name", contactName],
        ["Best contact", contactMethod === "email" ? `Email — ${user.email}` : `${method} — ${contactPhone}`],
        ["Email", user.email],
        ["Phone", contactPhone || "—"],
        ["Watch", watch],
        ["The issue", description],
        ["Photos", photoLinks.length ? photoLinks.map((u, i) => `Photo ${i + 1}: ${u}`).join("\n") : `${photoPaths.length} attached — see the request`],
        ["Send a quote", `${base}/marketplace/admin`],
        ["Request", `${base}/marketplace/requests/${created.id}`],
      ],
    });
    if (!notified.ok) console.error("[service-requests] notification email failed", { id: created.id });

    await sendMemberEmail({
      to: user.email,
      subject: "We received your RIHOSO repair request",
      intro: `Thank you, ${contactName.split(/\s+/)[0]}. We've received your request for the ${watch} and will get back to you by ${method.toLowerCase()} with a price or any questions. Please don't send the watch until you've agreed to a written quote.`,
      quote: description,
      ctaLabel: "View your request",
      ctaUrl: `${base}/marketplace/requests/${created.id}`,
    }).catch((err) => console.error("[service-requests] confirmation email failed", err));

    return NextResponse.json({ ok: true, id: created.id });
  } catch (err) {
    if (err instanceof UserError) return NextResponse.json({ error: err.message }, { status: 409 });
    console.error("[service-requests] failed", err);
    return NextResponse.json({ error: "Couldn't send the request. Please try again." }, { status: 502 });
  }
}
