import { NextResponse } from "next/server";
import { clean } from "@/lib/email";
import { UserError, startCheckout } from "@/lib/orders";
import { recordAcceptance } from "@/lib/policy-acceptance";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Buyer: pay for an offer. Returns a Stripe Checkout URL. */
export async function POST(request: Request) {
  const { user } = await getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const offerId = clean(data.offerId, 40);
  const fulfillment = data.fulfillment === "pickup" ? "pickup" : "ship";
  if (data.accept !== true) {
    return NextResponse.json({ error: "Please confirm you agree to the Terms of Use." }, { status: 400 });
  }
  try {
    const { url, orderId } = await startCheckout({ offerId, buyerId: user.id, fulfillment, request });
    await recordAcceptance(user.id, ["terms"], "checkout", { orderId, request });
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    if (err instanceof UserError) return NextResponse.json({ error: err.message }, { status: 409 });
    console.error("[checkout] failed", err);
    return NextResponse.json({ error: "Couldn't start checkout. Please try again." }, { status: 502 });
  }
}
