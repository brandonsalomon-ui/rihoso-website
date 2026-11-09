import { NextResponse } from "next/server";
import { clean } from "@/lib/email";
import { CLINIC_PRICE } from "@/lib/clinic";
import { startClinicCheckout, type GuestInput } from "@/lib/clinic-bookings";
import { UserError } from "@/lib/orders";
import { isStripeConfigured, siteUrl } from "@/lib/stripe";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";

/** Saves a Watchmaking Clinic booking and returns the Stripe Checkout URL. Prices are recalculated here. */
export async function POST(request: Request) {
  if (!isSupabaseConfigured() || !isStripeConfigured()) {
    return NextResponse.json({ error: "Online booking isn't available yet — please send an inquiry instead." }, { status: 503 });
  }
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (clean(data.website, 200)) return NextResponse.json({ error: "Invalid request" }, { status: 400 }); // honeypot
  if (data.accept !== true) {
    return NextResponse.json({ error: "Please confirm the booking terms." }, { status: 400 });
  }

  const rawGuests = Array.isArray(data.guests) ? data.guests.slice(0, CLINIC_PRICE.maximumSeats + 1) : [];
  const guests: GuestInput[] = rawGuests.map((g) => {
    const o = (g && typeof g === "object" ? g : {}) as Record<string, unknown>;
    return {
      name: clean(o.name, 120),
      member: o.member === true,
      memberEmail: clean(o.memberEmail, 200),
      codeId: clean(o.codeId, 40),
    };
  });

  try {
    const { url } = await startClinicCheckout(
      {
        fullName: clean(data.fullName, 120),
        email: clean(data.email, 200),
        phone: clean(data.phone, 40),
        location: clean(data.location, 300),
        locationNotes: clean(data.locationNotes, 2000),
        occasion: clean(data.occasion, 40),
        occasionDetails: clean(data.occasionDetails, 500),
        notes: clean(data.notes, 3000),
        guests,
      },
      siteUrl(request)
    );
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    if (err instanceof UserError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[clinic] checkout failed", err);
    return NextResponse.json({ error: "Couldn't start payment. Please try again." }, { status: 502 });
  }
}
