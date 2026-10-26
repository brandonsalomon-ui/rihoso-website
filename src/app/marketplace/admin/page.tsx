import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AdminButton from "@/components/exchange/AdminButton";
import QuoteButton from "@/components/exchange/QuoteButton";
import ExchangeNav from "@/components/exchange/ExchangeNav";
import { formatUsd } from "@/lib/marketplace";
import { isAdmin } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Watch Exchange Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const ORDER_LABEL: Record<string, string> = {
  pending_payment: "Awaiting payment",
  paid_held: "Paid — held",
  shipped: "Shipped",
  delivered: "Delivered",
  released: "Complete",
  disputed: "PROBLEM",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

const SERVICE_LABEL: Record<string, string> = {
  requested: "needs quote",
  awaiting_payment: "awaiting payment",
  paid: "PAID — to do",
  in_progress: "in progress",
  complete: "complete",
  cancelled: "cancelled",
};

function fmt(iso: string | null) {
  return iso ? new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" }) : "—";
}

type OrderRow = {
  id: string;
  status: string;
  amount_cents: number;
  commission_cents: number;
  fulfillment: string;
  dispute_reason: string | null;
  disputed_at: string | null;
  created_at: string;
  auto_release_at: string | null;
  listings: { id: string; title: string } | null;
  buyer: { display_name: string } | null;
  seller: { display_name: string } | null;
};

type SellerRow = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  member_claimed: boolean;
  payouts_enabled: boolean;
  created_at: string;
  profiles: { display_name: string; is_member: boolean } | null;
};

type RequestRow = {
  id: string;
  type: "validation" | "repair";
  status: string;
  description: string;
  price_cents: number | null;
  result_notes: string | null;
  created_at: string;
  listing_id: string | null;
  listings: { title: string } | null;
  requester: { display_name: string } | null;
};

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="panel-lux rounded-xl p-6 sm:p-8">
      <h2 className="font-display text-2xl text-cream-50 mb-4">
        {title} {typeof count === "number" && <span className="text-gold-400 text-lg">({count})</span>}
      </h2>
      {children}
    </div>
  );
}

export default async function AdminPage() {
  const { user } = await getUser();
  if (!user) redirect("/marketplace/sign-in?next=/marketplace/admin");
  if (!(await isAdmin(user.id))) notFound();

  const admin = createAdminClient();
  const ORDER_SELECT =
    "id, status, amount_cents, commission_cents, fulfillment, dispute_reason, disputed_at, created_at, auto_release_at, listings(id, title), buyer:profiles!orders_buyer_id_fkey(display_name), seller:profiles!orders_seller_id_fkey(display_name)";

  const [disputesRes, ordersRes, sellersRes, requestsRes, emailsRes] = await Promise.all([
    admin.from("orders").select(ORDER_SELECT).eq("status", "disputed").order("disputed_at", { ascending: true }),
    admin.from("orders").select(ORDER_SELECT).neq("status", "pending_payment").order("created_at", { ascending: false }).limit(50),
    admin
      .from("seller_accounts")
      .select("user_id, full_name, phone, member_claimed, payouts_enabled, created_at, profiles(display_name, is_member)")
      .order("created_at", { ascending: false }),
    admin
      .from("service_requests")
      .select("id, type, status, description, price_cents, result_notes, created_at, listing_id, listings(title), requester:profiles!service_requests_requester_id_fkey(display_name)")
      .order("created_at", { ascending: false })
      .limit(50),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emails = new Map((emailsRes.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));
  const disputes = (disputesRes.data ?? []) as unknown as OrderRow[];
  const orders = (ordersRes.data ?? []) as unknown as OrderRow[];
  const sellers = (sellersRes.data ?? []) as unknown as SellerRow[];
  const requests = (requestsRes.data ?? []) as unknown as RequestRow[];
  const memberQueue = sellers.filter((s) => s.member_claimed && !s.profiles?.is_member);
  const openRequests = requests.filter((r) => ["requested", "paid", "in_progress"].includes(r.status));

  const held = orders.filter((o) => ["paid_held", "shipped", "delivered", "disputed"].includes(o.status));
  const heldTotal = held.reduce((s, o) => s + o.amount_cents, 0);
  const feesEarned = orders.filter((o) => o.status === "released").reduce((s, o) => s + o.commission_cents, 0);

  return (
    <>
      <ExchangeNav signedIn />
      <section className="py-12 bg-forest-800 min-h-[70vh]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <p className="text-gold-400 text-xs uppercase tracking-[0.2em]">RIHOSO only</p>
            <h1 className="font-display text-3xl text-cream-50">Watch Exchange Admin</h1>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ["Problems to resolve", String(disputes.length)],
              ["Member approvals", String(memberQueue.length)],
              ["Money held now", formatUsd(heldTotal)],
              ["Fees earned (completed)", formatUsd(feesEarned)],
            ].map(([k, v]) => (
              <div key={k} className="card-lux rounded-xl p-5">
                <p className="text-xs text-cream-400 uppercase tracking-widest">{k}</p>
                <p className="font-display text-2xl text-gold-foil mt-1">{v}</p>
              </div>
            ))}
          </div>

          <Section title="Problems reported" count={disputes.length}>
            {disputes.length ? (
              <ul className="space-y-4">
                {disputes.map((o) => (
                  <li key={o.id} className="rounded-lg border border-red-400/30 bg-red-900/10 p-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <Link href={`/marketplace/orders/${o.id}`} className="text-cream-50 font-semibold hover:text-gold-300">
                        {o.listings?.title ?? "Watch"} — {formatUsd(o.amount_cents)}
                      </Link>
                      <span className="text-xs text-cream-400">Reported {fmt(o.disputed_at)}</span>
                    </div>
                    <p className="text-sm text-cream-300 mt-1">
                      Buyer: {o.buyer?.display_name} · Seller: {o.seller?.display_name}
                    </p>
                    {o.dispute_reason && <p className="mt-2 text-sm text-cream-100 whitespace-pre-line">“{o.dispute_reason}”</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <AdminButton
                        label="Refund buyer in full"
                        variant="danger"
                        body={{ action: "refund", id: o.id }}
                        confirmText={`Refund ${formatUsd(o.amount_cents)} to the buyer? This can't be undone.`}
                        promptText="Optional note to buyer and seller (shown in the email):"
                      />
                      <AdminButton
                        label="Release payment to seller"
                        variant="gold"
                        body={{ action: "release", id: o.id }}
                        confirmText="Release the held payment to the seller? This can't be undone."
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-cream-400 text-sm">No open problems.</p>
            )}
          </Section>

          <Section title="Member rate approvals" count={memberQueue.length}>
            <p className="text-sm text-cream-400 mb-4">
              Sellers who said they&apos;re RIHOSO members. Approving gives them the 5% member fee on new sales.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-cream-400">
                  <tr>
                    <th className="py-2 pr-4 font-normal">Seller</th>
                    <th className="py-2 pr-4 font-normal">Contact</th>
                    <th className="py-2 pr-4 font-normal">Payouts</th>
                    <th className="py-2 pr-4 font-normal">Member?</th>
                    <th className="py-2 font-normal" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-600/30">
                  {sellers.map((s) => (
                    <tr key={s.user_id} className={s.member_claimed && !s.profiles?.is_member ? "bg-gold-400/5" : ""}>
                      <td className="py-2 pr-4 text-cream-100">
                        {s.full_name ?? s.profiles?.display_name}
                        <span className="block text-xs text-cream-400">shown as {s.profiles?.display_name}</span>
                      </td>
                      <td className="py-2 pr-4 text-cream-300">
                        {emails.get(s.user_id)}
                        <span className="block text-xs">{s.phone}</span>
                      </td>
                      <td className="py-2 pr-4 text-cream-300">{s.payouts_enabled ? "Ready" : "Not finished"}</td>
                      <td className="py-2 pr-4 text-cream-300">
                        {s.profiles?.is_member ? "Verified member" : s.member_claimed ? "Says yes — check" : "No"}
                      </td>
                      <td className="py-2 text-right">
                        {s.profiles?.is_member ? (
                          <AdminButton label="Remove member rate" body={{ action: "set_member", id: s.user_id, value: false }} />
                        ) : (
                          <AdminButton label="Approve as member" variant="gold" body={{ action: "set_member", id: s.user_id, value: true }} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Repair requests" count={openRequests.length}>
            {requests.length ? (
              <ul className="divide-y divide-forest-600/30">
                {requests.map((r) => (
                  <li key={r.id} className="py-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="text-cream-100">
                        <span className="text-gold-400 text-xs uppercase tracking-widest mr-2">
                          {r.type === "validation" ? "Validation $100" : "Repair quote"}
                        </span>
                        {r.listing_id ? (
                          <Link href={`/marketplace/listings/${r.listing_id}`} className="hover:text-gold-300">
                            {r.listings?.title ?? "Listing"}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </p>
                      <span className="text-xs text-cream-400">
                        {r.requester?.display_name} · {fmt(r.created_at)} · <strong className="text-cream-200">{SERVICE_LABEL[r.status] ?? r.status}</strong>
                      </span>
                    </div>
                    {r.description && <p className="text-sm text-cream-300 mt-1 whitespace-pre-line">{r.description}</p>}
                    {r.result_notes && <p className="text-sm text-gold-200 mt-1">Result: {r.result_notes}</p>}
                    {r.price_cents ? <p className="text-sm text-cream-200 mt-1">Price: {formatUsd(r.price_cents)}</p> : null}
                    {!["complete", "cancelled"].includes(r.status) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {r.type === "repair" && ["requested", "awaiting_payment"].includes(r.status) && (
                          <QuoteButton id={r.id} hasQuote={r.status === "awaiting_payment"} />
                        )}
                        {["paid"].includes(r.status) && (
                          <AdminButton label="Mark in progress" body={{ action: "service_status", id: r.id, status: "in_progress" }} />
                        )}
                        {!["paid", "in_progress"].includes(r.status) ? null : r.type === "validation" ? (
                          <>
                            <AdminButton
                              label="Complete — passed"
                              variant="gold"
                              body={{ action: "service_status", id: r.id, status: "complete", outcome: "passed" }}
                              promptText="Validation notes shown on the listing (e.g. 'Movement, dial and case consistent with reference. Inspected by …'):"
                            />
                            <AdminButton
                              label="Complete — concerns"
                              variant="danger"
                              body={{ action: "service_status", id: r.id, status: "complete", outcome: "concerns" }}
                              promptText="What concerns were found? (shown on the listing)"
                            />
                          </>
                        ) : (
                          <AdminButton
                            label="Mark complete"
                            variant="gold"
                            body={{ action: "service_status", id: r.id, status: "complete" }}
                            promptText="Notes (quote, work done):"
                          />
                        )}
                        <AdminButton
                          label={["paid", "in_progress"].includes(r.status) ? "Cancel & refund" : "Cancel"}
                          variant="danger"
                          body={{ action: "cancel_service", id: r.id }}
                          confirmText={["paid", "in_progress"].includes(r.status) ? "Cancel this request and refund the payment in full?" : "Cancel this request?"}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-cream-400 text-sm">No requests yet.</p>
            )}
          </Section>

          <Section title="All orders" count={orders.length}>
            {orders.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-cream-400">
                    <tr>
                      <th className="py-2 pr-4 font-normal">Watch</th>
                      <th className="py-2 pr-4 font-normal">Buyer → Seller</th>
                      <th className="py-2 pr-4 font-normal">Amount / fee</th>
                      <th className="py-2 pr-4 font-normal">Status</th>
                      <th className="py-2 font-normal">Placed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest-600/30">
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td className="py-2 pr-4">
                          <Link href={`/marketplace/orders/${o.id}`} className="text-cream-100 hover:text-gold-300">
                            {o.listings?.title ?? "Watch"}
                          </Link>
                        </td>
                        <td className="py-2 pr-4 text-cream-300">
                          {o.buyer?.display_name} → {o.seller?.display_name}
                        </td>
                        <td className="py-2 pr-4 text-cream-300">
                          {formatUsd(o.amount_cents)} / {formatUsd(o.commission_cents)}
                        </td>
                        <td className={`py-2 pr-4 ${o.status === "disputed" ? "text-red-300 font-semibold" : "text-cream-200"}`}>
                          {ORDER_LABEL[o.status] ?? o.status}
                          {o.status === "delivered" && o.auto_release_at && (
                            <span className="block text-xs text-cream-400">auto-release {fmt(o.auto_release_at)}</span>
                          )}
                        </td>
                        <td className="py-2 text-cream-400">{fmt(o.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-cream-400 text-sm">No orders yet.</p>
            )}
          </Section>
        </div>
      </section>
    </>
  );
}
