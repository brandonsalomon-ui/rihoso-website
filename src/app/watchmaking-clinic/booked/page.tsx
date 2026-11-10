import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PageHero from "@/components/PageHero";
import { dollars } from "@/lib/clinic";
import { finalizeClinicCheckout, type ClinicBooking } from "@/lib/clinic-bookings";
import { isStripeConfigured } from "@/lib/stripe";
import TikTokPurchase from "@/components/TikTokPurchase";

export const metadata: Metadata = { title: "Clinic booked", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ClinicBooked({ searchParams }: { searchParams: { session_id?: string } }) {
  const sessionId = searchParams.session_id ?? "";
  if (!isStripeConfigured() || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) redirect("/watchmaking-clinic");

  let booking: ClinicBooking | null = null;
  try {
    booking = await finalizeClinicCheckout(sessionId);
  } catch (err) {
    console.error("[clinic] finalize failed", err);
  }
  const paid = booking?.status === "paid";

  return (
    <>
      <PageHero eyebrow="Watchmaking Clinic" title={paid ? "Your clinic is booked" : "Thank you"} />
      <section className="py-20 bg-forest-800 min-h-[40vh]">
        <div className="max-w-lg mx-auto px-4 text-center panel-lux rounded-xl p-8 space-y-4">
          {paid && booking ? (
            <>
              <TikTokPurchase
                eventId={sessionId}
                value={booking.amount_cents / 100}
                contentId="watchmaking-clinic"
                contentName="Watchmaking Clinic"
                quantity={booking.seats}
              />
              <p className="text-cream-100 text-lg">
                Thank you, {booking.full_name.split(/\s+/)[0]}. We&apos;ve received {dollars(booking.amount_cents)} for{" "}
                {booking.seats} people.
              </p>
              <p className="text-cream-300 text-sm">
                We&apos;ll be in touch shortly by email or phone to set the date and introduce your watchmaker. A confirmation
                email is on its way to {booking.email}. Guests listed as TBD can be named any time — just reply to that email.
              </p>
            </>
          ) : (
            <p className="text-cream-300">
              We&apos;re confirming your payment. This can take a moment — you&apos;ll get a confirmation email as soon as it
              goes through.
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/watchmaking-clinic" className="btn-gold px-6 py-3 font-semibold">Back to the clinic</Link>
            <Link href="/memberships" className="px-6 py-3 rounded border border-cream-200/30 text-cream-100 hover:border-gold-400">
              RIHOSO membership
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
