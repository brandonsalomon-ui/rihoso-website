import { NextResponse } from "next/server";
import { clean } from "@/lib/email";
import { UserError } from "@/lib/orders";
import { startPartnerCheckout } from "@/lib/repair-partners";
import { isStripeConfigured, siteUrl } from "@/lib/stripe";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Become (or renew as) a RIHOSO Repair Partner: saves the shop's details and returns the Stripe Checkout URL. */
export async function POST(request: Request) {
  if (!isStripeConfigured()) return NextResponse.json({ error: "Online payment isn't available right now." }, { status: 503 });
  const { user } = await getUser();
  if (!user?.email) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const d = {
    businessName: clean(data.businessName, 120),
    contactName: clean(data.contactName, 120),
    phone: clean(data.phone, 40),
    website: clean(data.website, 200),
    city: clean(data.city, 80),
    address: clean(data.address, 200),
    blurb: clean(data.blurb, 600),
  };
  const missing = [
    d.businessName.length < 2 && "your business name",
    !d.contactName && "your name",
    d.phone.replace(/\D/g, "").length < 7 && "a business phone number",
    !d.city && "your city or town",
  ].filter(Boolean);
  if (missing.length) return NextResponse.json({ error: `Please add ${missing.join(", ")}.` }, { status: 400 });
  if (data.accept !== true) return NextResponse.json({ error: "Please confirm you agree to the Repair Partner terms." }, { status: 400 });

  try {
    const url = await startPartnerCheckout(user.id, user.email, d, siteUrl(request));
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    if (err instanceof UserError) return NextResponse.json({ error: err.message }, { status: 409 });
    console.error("[repair-partners] checkout failed", err);
    return NextResponse.json({ error: "Couldn't start payment. Please try again." }, { status: 502 });
  }
}
