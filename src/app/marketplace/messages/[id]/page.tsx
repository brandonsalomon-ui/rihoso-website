import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ExchangeNav from "@/components/exchange/ExchangeNav";
import ReplyForm from "@/components/exchange/ReplyForm";
import { formatUsd } from "@/lib/marketplace";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Conversation", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const { supabase, user } = await getUser();
  if (!user) redirect(`/marketplace/sign-in?next=/marketplace/messages/${params.id}`);
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();

  const { data: conv } = await supabase
    .from("conversations")
    .select(
      "id, buyer_id, seller_id, listing_id, listings(id, title, price_cents, status), buyer:profiles!conversations_buyer_id_fkey(display_name), seller:profiles!conversations_seller_id_fkey(display_name)"
    )
    .eq("id", params.id)
    .maybeSingle();
  if (!conv) notFound();
  const c = conv as unknown as {
    id: string;
    buyer_id: string;
    seller_id: string;
    listings: { id: string; title: string; price_cents: number; status: string } | null;
    buyer: { display_name: string } | null;
    seller: { display_name: string } | null;
  };

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", c.id)
    .order("created_at", { ascending: true });

  const names: Record<string, string> = {
    [c.buyer_id]: c.buyer?.display_name ?? "Buyer",
    [c.seller_id]: c.seller?.display_name ?? "Seller",
  };

  return (
    <>
      <ExchangeNav signedIn />
      <section className="py-12 bg-forest-800 min-h-[60vh]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/marketplace/messages" className="text-sm text-gold-400 hover:text-gold-300">← All messages</Link>
          {c.listings && (
            <Link href={`/marketplace/listings/${c.listings.id}`} className="mt-4 block panel-lux rounded-xl px-6 py-4 hover:bg-gold-400/5">
              <p className="text-cream-50 font-display text-lg">{c.listings.title}</p>
              <p className="text-sm text-cream-400">
                {formatUsd(c.listings.price_cents)} · {user.id === c.seller_id ? "You're the seller" : `Seller: ${names[c.seller_id]}`}
              </p>
            </Link>
          )}

          <ol className="mt-8 space-y-4">
            {(messages ?? []).map((m) => {
              const mine = m.sender_id === user.id;
              return (
                <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-3 ${mine ? "bg-gold-400/15 border border-gold-400/30" : "bg-forest-900 border border-forest-600/40"}`}>
                    <p className="text-xs text-cream-400 mb-1">
                      {mine ? "You" : names[m.sender_id] ?? "Collector"} ·{" "}
                      {new Date(m.created_at).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" })}
                    </p>
                    <p className="text-cream-100 whitespace-pre-line">{m.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-8">
            <ReplyForm conversationId={c.id} />
          </div>
          <p className="mt-6 text-xs text-cream-400">
            For your protection, keep conversations and payment on RIHOSO. Never pay a seller directly by wire, Zelle or gift card.
          </p>
        </div>
      </section>
    </>
  );
}
