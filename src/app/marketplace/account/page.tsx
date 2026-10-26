import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PageHero from "@/components/PageHero";
import ExchangeNav from "@/components/exchange/ExchangeNav";
import DisplayNameForm from "@/components/exchange/DisplayNameForm";
import { formatUsd } from "@/lib/marketplace";
import { getSellerAccount, syncSellerFromStripe } from "@/lib/sellers";
import { isAdmin } from "@/lib/orders";
import { isStripeConfigured } from "@/lib/stripe";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My Account", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  active: "Live",
  reserved: "Reserved",
  sold: "Sold",
  withdrawn: "Withdrawn",
  removed: "Removed",
};

const ORDER_LABEL: Record<string, string> = {
  paid_held: "Paid — held",
  shipped: "Shipped",
  delivered: "Delivered",
  released: "Complete",
  disputed: "Problem reported",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

export default async function AccountPage() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/marketplace/sign-in?next=/marketplace/account");

  let seller = await getSellerAccount(user.id);
  if (seller && !seller.payouts_enabled && isStripeConfigured()) {
    try {
      await syncSellerFromStripe(seller.stripe_account_id);
      seller = await getSellerAccount(user.id);
    } catch {}
  }

  const [{ data: profile }, { data: listings }, { data: requests }, { data: orders }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("display_name, is_member").eq("id", user.id).single(),
    supabase
      .from("listings")
      .select("id, title, brand, price_cents, status, validation_status, created_at")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("service_requests")
      .select("id, type, status, created_at, listing_id")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("orders")
      .select("id, buyer_id, seller_id, amount_cents, status, created_at, listings(title)")
      .neq("status", "pending_payment")
      .order("created_at", { ascending: false })
      .limit(25),
    supabase
      .from("memberships")
      .select("period_end")
      .eq("user_id", user.id)
      .eq("status", "paid")
      .order("period_end", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const memberUntil = membership?.period_end ? new Date(membership.period_end as string) : null;
  const memberActive = Boolean(memberUntil && memberUntil > new Date());
  const fmtLong = (d: Date) => d.toLocaleDateString("en-US", { timeZone: "America/New_York", dateStyle: "long" });
  const orderRows = (orders ?? []) as unknown as {
    id: string;
    buyer_id: string;
    seller_id: string;
    amount_cents: number;
    status: string;
    created_at: string;
    listings: { title: string } | null;
  }[];

  const showAdmin = await isAdmin(user.id);

  return (
    <>
      <PageHero eyebrow="Watch Exchange" title="My Account" />
      <ExchangeNav signedIn />
      <section className="py-14 bg-forest-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {showAdmin && (
            <Link href="/marketplace/admin" className="block panel-lux rounded-xl px-6 py-4 border border-gold-400/40 hover:bg-gold-400/5">
              <span className="text-gold-300 font-semibold">RIHOSO admin →</span>
              <span className="block text-sm text-cream-400">Member approvals, problems & refunds, all orders, repair requests</span>
            </Link>
          )}
          <div className="panel-lux rounded-xl p-6 sm:p-8">
            <h2 className="font-display text-2xl text-cream-50 mb-1">Profile</h2>
            <p className="text-sm text-cream-400 mb-5">
              Signed in as {user.email}.
            </p>
            <p className="text-sm text-cream-200 mb-5">
              {memberActive && memberUntil ? (
                <>
                  RIHOSO member until {fmtLong(memberUntil)} (doesn&apos;t renew automatically).{" "}
                  <Link href="/memberships#join" className="text-gold-400 hover:text-gold-300">Renew early →</Link>
                </>
              ) : profile?.is_member ? (
                "RIHOSO member."
              ) : (
                <>
                  {memberUntil ? `Your membership ended ${fmtLong(memberUntil)}. ` : "Not a RIHOSO member yet. "}
                  <Link href="/memberships#join" className="text-gold-400 hover:text-gold-300">
                    {memberUntil ? "Renew" : "Join"} for $120/year — 5% selling fee →
                  </Link>
                </>
              )}
            </p>
            <DisplayNameForm userId={user.id} initial={profile?.display_name ?? ""} />
            <form action="/auth/sign-out" method="post" className="mt-6">
              <button className="text-sm text-cream-400 hover:text-gold-300">Sign out</button>
            </form>
          </div>

          <div className="panel-lux rounded-xl p-6 sm:p-8">
            <h2 className="font-display text-2xl text-cream-50 mb-3">Selling</h2>
            {!seller ? (
              <p className="text-cream-300">
                Set up payouts to start selling.{" "}
                <Link href="/marketplace/sell" className="text-gold-400 hover:text-gold-300">Become a seller →</Link>
              </p>
            ) : seller.payouts_enabled ? (
              <p className="text-cream-300">
                Payouts are set up. Selling fee: {profile?.is_member ? "5% (member rate)" : "10%"}
                {!profile?.is_member && seller.member_claimed ? " — member rate pending verification" : ""}.
              </p>
            ) : (
              <p className="text-cream-300">
                Your payout setup isn&apos;t finished.{" "}
                <Link href="/marketplace/sell" className="text-gold-400 hover:text-gold-300">Continue setup →</Link>
              </p>
            )}

            <div className="mt-6 flex items-center justify-between">
              <h3 className="font-display text-xl text-cream-50">My listings</h3>
              <Link href="/marketplace/listings/new" className="btn-gold px-4 py-2 rounded text-sm font-semibold">List a watch</Link>
            </div>
            {listings?.length ? (
              <ul className="mt-4 divide-y divide-forest-600/30">
                {listings.map((l) => (
                  <li key={l.id} className="py-3 flex items-center justify-between gap-4">
                    <Link href={`/marketplace/listings/${l.id}`} className="text-cream-100 hover:text-gold-300">
                      <span className="text-gold-400 text-xs uppercase tracking-widest mr-2">{l.brand}</span>
                      {l.title}
                    </Link>
                    <span className="text-sm text-cream-400 whitespace-nowrap">
                      {formatUsd(l.price_cents)} · {STATUS_LABEL[l.status] ?? l.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-cream-400 text-sm">No listings yet.</p>
            )}
          </div>

          {orderRows.length ? (
            <div className="panel-lux rounded-xl p-6 sm:p-8">
              <h2 className="font-display text-2xl text-cream-50 mb-3">Orders</h2>
              <ul className="divide-y divide-forest-600/30 text-sm">
                {orderRows.map((o) => (
                  <li key={o.id} className="py-3 flex justify-between gap-4">
                    <Link href={`/marketplace/orders/${o.id}`} className="text-cream-100 hover:text-gold-300">
                      <span className="text-gold-400 text-xs uppercase tracking-widest mr-2">{o.seller_id === user.id ? "Sold" : "Bought"}</span>
                      {o.listings?.title ?? "Watch"}
                    </Link>
                    <span className="text-cream-400 whitespace-nowrap">
                      {formatUsd(o.amount_cents)} · {ORDER_LABEL[o.status] ?? o.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {requests?.length ? (
            <div className="panel-lux rounded-xl p-6 sm:p-8">
              <h2 className="font-display text-2xl text-cream-50 mb-3">Repair requests</h2>
              <ul className="divide-y divide-forest-600/30 text-sm">
                {requests.map((r) => (
                  <li key={r.id} className="py-3 flex justify-between gap-4 text-cream-200">
                    <Link href={`/marketplace/requests/${r.id}`} className="hover:text-gold-300">
                      {r.type === "validation" ? "Member validation" : "Repair"}
                    </Link>
                    <span className="text-cream-400">
                      {r.status === "awaiting_payment" ? "ready to pay" : r.status === "requested" ? "awaiting quote" : r.status.replace("_", " ")} · {new Date(r.created_at).toLocaleDateString("en-US")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
