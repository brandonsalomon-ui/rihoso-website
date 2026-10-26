import { NextResponse } from "next/server";
import { clean, sendMemberEmail } from "@/lib/email";
import { formatUsd } from "@/lib/marketplace";
import { siteUrl } from "@/lib/stripe";
import { createAdminClient, getUserEmail } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Seller: "Sell to this buyer at $X" from inside a conversation. */
export async function POST(request: Request) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const conversationId = clean(data.conversationId, 40);
  const amount = Math.round(parseFloat(String(data.amount ?? "").replace(/[$,]/g, "")) * 100);
  const allowsShipping = data.allowsShipping === true;
  const allowsPickup = data.allowsPickup === true;
  if (!Number.isFinite(amount) || amount < 100) return NextResponse.json({ error: "Please enter a price of at least $1." }, { status: 400 });
  if (!allowsShipping && !allowsPickup) return NextResponse.json({ error: "Choose shipping, pickup, or both." }, { status: 400 });

  // Read as the user: they must be a participant to see the conversation at all.
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, listing_id, buyer_id, seller_id, listings(title, status)")
    .eq("id", conversationId)
    .maybeSingle();
  const c = conv as unknown as { id: string; listing_id: string; buyer_id: string; seller_id: string; listings: { title: string; status: string } | null } | null;
  if (!c) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  if (c.seller_id !== user.id) return NextResponse.json({ error: "Only the seller can set a sale price." }, { status: 403 });
  if (!c.listings || c.listings.status !== "active") return NextResponse.json({ error: "This listing isn't available for sale." }, { status: 409 });

  const admin = createAdminClient();
  await admin.from("offers").update({ status: "cancelled" }).eq("conversation_id", c.id).eq("status", "open");
  const { data: offer, error } = await admin
    .from("offers")
    .insert({
      listing_id: c.listing_id,
      conversation_id: c.id,
      buyer_id: c.buyer_id,
      seller_id: c.seller_id,
      amount_cents: amount,
      allows_shipping: allowsShipping,
      allows_pickup: allowsPickup,
    })
    .select("id")
    .single();
  if (error) {
    console.error("[offers] create failed", error);
    return NextResponse.json({ error: "Couldn't create the offer." }, { status: 500 });
  }

  const base = siteUrl(request);
  const summary = `${formatUsd(amount)} — ${[allowsShipping && "insured shipping", allowsPickup && "local pickup"].filter(Boolean).join(" or ")}`;
  await admin.from("messages").insert({
    conversation_id: c.id,
    sender_id: user.id,
    body: `I'll sell it to you for ${summary}. Use the "Pay" button in this conversation within 72 hours — RIHOSO holds the payment until you confirm you've received the watch.`,
  });
  try {
    const to = await getUserEmail(c.buyer_id);
    if (to) {
      await sendMemberEmail({
        to,
        subject: `The seller accepted: ${c.listings.title} for ${formatUsd(amount)}`,
        intro: `Good news — the seller will sell you “${c.listings.title}” for ${summary}. Pay securely on RIHOSO within 72 hours. RIHOSO holds your payment until you confirm the watch arrived as described.`,
        ctaLabel: "Review and pay",
        ctaUrl: `${base}/marketplace/messages/${c.id}`,
      });
    }
  } catch (err) {
    console.error("[offers] email failed", err);
  }
  return NextResponse.json({ ok: true, id: offer.id });
}

/** Seller withdraws an open offer. */
export async function DELETE(request: Request) {
  const { user } = await getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const admin = createAdminClient();
  const { data: offer } = await admin.from("offers").select("id, seller_id, status").eq("id", id).maybeSingle();
  if (!offer || offer.seller_id !== user.id) return NextResponse.json({ error: "Offer not found." }, { status: 404 });
  if (offer.status !== "open") return NextResponse.json({ error: "This offer can't be withdrawn." }, { status: 409 });
  await admin.from("offers").update({ status: "cancelled" }).eq("id", id);
  return NextResponse.json({ ok: true });
}
