import { NextResponse } from "next/server";
import { clean } from "@/lib/email";
import { DONATION_MAX_CENTS, DONATION_MIN_CENTS, dollars, parseAmountCents, startDonationCheckout } from "@/lib/donations";
import { isStripeConfigured, siteUrl } from "@/lib/stripe";

export const runtime = "nodejs";

/** General donation, any amount: no sign-in. Returns the Stripe Checkout URL. */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Online giving isn't available right now." }, { status: 503 });
  }
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (clean(data.website, 200)) return NextResponse.json({ error: "Invalid request" }, { status: 400 }); // honeypot

  const cents = parseAmountCents(data.amount);
  if (cents === null || cents < DONATION_MIN_CENTS) {
    return NextResponse.json({ error: `Please enter an amount of at least ${dollars(DONATION_MIN_CENTS)}.` }, { status: 400 });
  }
  if (cents > DONATION_MAX_CENTS) {
    return NextResponse.json(
      { error: `For gifts over ${dollars(DONATION_MAX_CENTS)}, please contact us at membership@rihoso.com.` },
      { status: 400 }
    );
  }

  try {
    const url = await startDonationCheckout(cents, siteUrl(request));
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error("[donate] checkout failed", err);
    return NextResponse.json({ error: "Couldn't start payment. Please try again." }, { status: 502 });
  }
}
