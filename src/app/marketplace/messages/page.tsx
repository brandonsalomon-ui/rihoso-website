import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PageHero from "@/components/PageHero";
import ExchangeNav from "@/components/exchange/ExchangeNav";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Messages", robots: { index: false } };
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  listings: { title: string } | null;
  buyer: { display_name: string } | null;
  seller: { display_name: string } | null;
};

export default async function MessagesPage() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/marketplace/sign-in?next=/marketplace/messages");

  const { data } = await supabase
    .from("conversations")
    .select(
      "id, buyer_id, seller_id, last_message_at, listings(title), buyer:profiles!conversations_buyer_id_fkey(display_name), seller:profiles!conversations_seller_id_fkey(display_name)"
    )
    .order("last_message_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageHero eyebrow="Watch Exchange" title="Messages" />
      <ExchangeNav signedIn />
      <section className="py-14 bg-forest-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {rows.length ? (
            <ul className="panel-lux rounded-xl divide-y divide-forest-600/30">
              {rows.map((c) => {
                const selling = c.seller_id === user.id;
                const other = selling ? c.buyer?.display_name : c.seller?.display_name;
                return (
                  <li key={c.id}>
                    <Link href={`/marketplace/messages/${c.id}`} className="block px-6 py-4 hover:bg-gold-400/5">
                      <p className="text-cream-50">{c.listings?.title ?? "Listing"}</p>
                      <p className="text-sm text-cream-400">
                        {selling ? "Buyer" : "Seller"}: {other ?? "Collector"} ·{" "}
                        {new Date(c.last_message_at).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="panel-lux rounded-xl p-8 text-center text-cream-300">
              No conversations yet. <Link href="/marketplace" className="text-gold-400">Browse watches</Link>
            </p>
          )}
        </div>
      </section>
    </>
  );
}
