import { NextResponse } from "next/server";
import { finalizeCheckout } from "@/lib/orders";
import { getStripe, siteUrl } from "@/lib/stripe";

export const runtime = "nodejs";

/** Stripe → RIHOSO: confirms paid checkouts even if the buyer closes the browser. */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const signature = request.headers.get("stripe-signature") ?? "";
  const payload = await request.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }
  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await finalizeCheckout(event.data.object.id, siteUrl(request));
    }
  } catch (err) {
    console.error("[webhook] failed", event.type, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
