import Link from "next/link";
import { redirect } from "next/navigation";
import { finalizeCheckout } from "@/lib/orders";
import { headers } from "next/headers";
import { getUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccess({ searchParams }: { searchParams: { session_id?: string } }) {
  const { user } = await getUser();
  const sessionId = searchParams.session_id ?? "";
  if (!user || !/^cs_/.test(sessionId)) redirect("/marketplace");
  let orderId: string | null = null;
  try {
    const host = headers().get("x-forwarded-host") ?? headers().get("host");
    const base = process.env.NEXT_PUBLIC_SITE_URL || (host ? `https://${host}` : "https://rihoso.com");
    const order = await finalizeCheckout(sessionId, base);
    if (order && order.buyer_id === user.id) orderId = order.id;
  } catch (err) {
    console.error("[checkout] finalize failed", err);
  }
  if (orderId) redirect(`/marketplace/orders/${orderId}`);
  return (
    <section className="py-24 bg-forest-800 min-h-[60vh]">
      <div className="max-w-md mx-auto px-4 text-center panel-lux rounded-xl p-8">
        <h1 className="text-2xl font-display text-cream-50 mb-3">Thanks — we&apos;re confirming your payment</h1>
        <p className="text-cream-300 mb-6">This can take a moment. You&apos;ll get an email as soon as it&apos;s confirmed.</p>
        <Link href="/marketplace/account" className="btn-gold inline-block px-8 py-3 font-semibold">My account</Link>
      </div>
    </section>
  );
}
