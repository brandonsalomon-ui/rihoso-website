import { NextResponse } from "next/server";
import { clean } from "@/lib/email";
import { UserError } from "@/lib/orders";
import { isStripeConfigured, siteUrl } from "@/lib/stripe";
import { startWolfCheckout } from "@/lib/wolf-orders";

export const runtime = "nodejs";

/** Starts Stripe Checkout for one WOLF Collection item. Prices are taken from the catalog on the server. */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Online ordering isn't available right now — please contact us." }, { status: 503 });
  }
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const { url } = await startWolfCheckout(
      { slug: clean(data.slug, 80), sku: clean(data.sku, 20), quantity: Number(data.quantity ?? 1), shipState: clean(data.shipState, 2) },
      siteUrl(request)
    );
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    if (err instanceof UserError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[wolf] checkout failed", err);
    return NextResponse.json({ error: "Couldn't start checkout. Please try again." }, { status: 502 });
  }
}
