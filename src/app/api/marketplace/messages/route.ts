import { NextResponse } from "next/server";
import { clean, sendMemberEmail } from "@/lib/email";
import { getUserEmail } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/stripe";

export const runtime = "nodejs";

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * Sends a message. Pass { listingId, body } to start (or continue) a conversation with
 * a listing's seller, or { conversationId, body } to reply. Row-level security makes
 * sure only the buyer and seller can read or post.
 */
export async function POST(request: Request) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const body = clean(data.body, 4000);
  const listingId = clean(data.listingId, 40);
  let conversationId = clean(data.conversationId, 40);
  if (!body) return NextResponse.json({ error: "Please write a message." }, { status: 400 });

  let conv: { id: string; buyer_id: string; seller_id: string; listing_id: string } | null = null;

  if (conversationId && UUID.test(conversationId)) {
    const { data: c } = await supabase
      .from("conversations")
      .select("id, buyer_id, seller_id, listing_id")
      .eq("id", conversationId)
      .maybeSingle();
    conv = c;
  } else if (listingId && UUID.test(listingId)) {
    const { data: listing } = await supabase
      .from("listings")
      .select("id, seller_id, status")
      .eq("id", listingId)
      .maybeSingle();
    if (!listing || !["active", "reserved"].includes(listing.status)) {
      return NextResponse.json({ error: "This listing isn't available." }, { status: 404 });
    }
    if (listing.seller_id === user.id) {
      return NextResponse.json({ error: "This is your own listing." }, { status: 400 });
    }
    const { data: existing } = await supabase
      .from("conversations")
      .select("id, buyer_id, seller_id, listing_id")
      .eq("listing_id", listingId)
      .eq("buyer_id", user.id)
      .maybeSingle();
    conv = existing;
    if (!conv) {
      const { data: created, error } = await supabase
        .from("conversations")
        .insert({ listing_id: listingId, buyer_id: user.id, seller_id: listing.seller_id })
        .select("id, buyer_id, seller_id, listing_id")
        .single();
      if (error) {
        console.error("[messages] create conversation failed", error);
        return NextResponse.json({ error: "Couldn't start the conversation." }, { status: 400 });
      }
      conv = created;
    }
  }

  if (!conv) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  conversationId = conv.id;

  const { error } = await supabase.from("messages").insert({ conversation_id: conv.id, sender_id: user.id, body });
  if (error) {
    console.error("[messages] insert failed", error);
    return NextResponse.json({ error: "Couldn't send your message." }, { status: 400 });
  }

  // Email the other person (best effort — never blocks the message).
  try {
    const recipientId = user.id === conv.buyer_id ? conv.seller_id : conv.buyer_id;
    const [{ data: listing }, { data: me }, to] = await Promise.all([
      supabase.from("listings").select("title").eq("id", conv.listing_id).maybeSingle(),
      supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
      getUserEmail(recipientId),
    ]);
    if (to) {
      await sendMemberEmail({
        to,
        subject: `New message about ${listing?.title ?? "your watch"}`,
        intro: `${me?.display_name ?? "A collector"} sent you a message on the RIHOSO Watch Exchange about “${listing?.title ?? "a watch"}”:`,
        quote: body.length > 600 ? body.slice(0, 600) + "…" : body,
        ctaLabel: "Reply on RIHOSO",
        ctaUrl: `${siteUrl(request)}/marketplace/messages/${conv.id}`,
      });
    }
  } catch (err) {
    console.error("[messages] notification failed", err);
  }

  return NextResponse.json({ ok: true, conversationId });
}
