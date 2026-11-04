import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ExchangeNav from "@/components/exchange/ExchangeNav";
import MemberDirectory, { type DirectoryRow } from "@/components/admin/MemberDirectory";
import MemberEmailComposer, { type AudienceOption } from "@/components/admin/MemberEmailComposer";
import { EVENTS } from "@/lib/events";
import { audiences, isMember, loadDirectory, recipients, STATUS_LABEL } from "@/lib/member-mail";
import { isAdmin } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Members & Email", robots: { index: false } };
export const dynamic = "force-dynamic";

const fmtDay = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { timeZone: "America/New_York", dateStyle: "medium" }) : "";
const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" }) : "—";

type CampaignRow = {
  id: string;
  subject: string;
  audience_label: string;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  skipped_unsubscribed: number;
  status: string;
  created_at: string;
};

export default async function MembersAdminPage() {
  const { user } = await getUser();
  if (!user) redirect("/marketplace/sign-in?next=/marketplace/admin/members");
  if (!(await isAdmin(user.id))) notFound();

  const [people, campaignsRes] = await Promise.all([
    loadDirectory(),
    createAdminClient()
      .from("email_campaigns")
      .select("id, subject, audience_label, recipient_count, sent_count, failed_count, skipped_unsubscribed, status, created_at")
      .order("created_at", { ascending: false })
      .limit(25),
  ]);
  const mailReady = !campaignsRes.error;
  const campaigns = (campaignsRes.data ?? []) as CampaignRow[];

  const eventName = new Map(EVENTS.filter((e) => e.rsvp).map((e) => [e.rsvp!.slug, e.shortTitle || e.title]));
  const rows: DirectoryRow[] = people.map((p) => ({
    email: p.email,
    name: p.name,
    phone: p.phone,
    status: p.status,
    statusLabel: STATUS_LABEL[p.status],
    since: fmtDay(p.since),
    memberUntil: p.status === "approved" && !p.memberUntil ? "No end date" : fmtDay(p.memberUntil),
    events: p.events.map((s) => eventName.get(s) ?? s),
    unsubscribed: p.unsubscribed,
  }));
  const options: AudienceOption[] = audiences().map((a) => {
    const r = recipients(people, a.id)!;
    return { id: a.id, label: a.label, hint: a.hint, count: r.to.length, skipped: r.skipped };
  });

  const members = people.filter(isMember).length;
  const ended = people.filter((p) => p.status === "expired").length;
  const others = people.length - members - ended;
  const unsubscribed = people.filter((p) => p.unsubscribed).length;

  return (
    <>
      <ExchangeNav signedIn />
      <section className="py-12 bg-forest-800 min-h-[70vh]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-gold-400 text-xs uppercase tracking-[0.2em]">RIHOSO only</p>
              <h1 className="font-display text-3xl text-cream-50">Members &amp; Email</h1>
            </div>
            <Link href="/marketplace/admin" className="text-sm text-cream-300 hover:text-gold-300">← Back to admin</Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ["Current members", members],
              ["Membership ended", ended],
              ["Accounts & RSVPs", others],
              ["Unsubscribed", unsubscribed],
            ].map(([k, v]) => (
              <div key={k as string} className="card-lux rounded-xl p-5">
                <p className="text-xs text-cream-400 uppercase tracking-widest">{k}</p>
                <p className="font-display text-2xl text-gold-foil mt-1">{v}</p>
              </div>
            ))}
          </div>

          <div className="panel-lux rounded-xl p-6 sm:p-8">
            <h2 className="font-display text-2xl text-cream-50 mb-1">Email an announcement</h2>
            <p className="text-sm text-cream-400 mb-6">Meet-ups, member news, reminders — to members, past members, everyone, or an event&apos;s RSVPs.</p>
            {mailReady ? (
              <MemberEmailComposer audiences={options} adminEmail={user.email ?? ""} />
            ) : (
              <p className="text-sm text-red-200">
                Email sending isn&apos;t switched on yet — the database update (migration 0009) still needs to be applied.
              </p>
            )}
          </div>

          <div className="panel-lux rounded-xl p-6 sm:p-8">
            <h2 className="font-display text-2xl text-cream-50 mb-4">Member list</h2>
            <MemberDirectory rows={rows} />
          </div>

          <div className="panel-lux rounded-xl p-6 sm:p-8">
            <h2 className="font-display text-2xl text-cream-50 mb-4">
              Sent log <span className="text-gold-400 text-lg">({campaigns.length})</span>
            </h2>
            {campaigns.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-cream-400">
                    <tr>
                      <th className="py-2 pr-4 font-normal">Sent</th>
                      <th className="py-2 pr-4 font-normal">Subject</th>
                      <th className="py-2 pr-4 font-normal">To</th>
                      <th className="py-2 font-normal">Delivered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest-600/30">
                    {campaigns.map((c) => (
                      <tr key={c.id}>
                        <td className="py-2 pr-4 text-cream-400 whitespace-nowrap">{fmtTime(c.created_at)}</td>
                        <td className="py-2 pr-4 text-cream-100">{c.subject}</td>
                        <td className="py-2 pr-4 text-cream-300">{c.audience_label}</td>
                        <td className="py-2 text-cream-300 whitespace-nowrap">
                          {c.status === "sending" ? (
                            "Sending…"
                          ) : (
                            <>
                              {c.sent_count} of {c.recipient_count}
                              {c.failed_count > 0 && <span className="block text-xs text-red-300">{c.failed_count} failed</span>}
                              {c.skipped_unsubscribed > 0 && <span className="block text-xs text-cream-400">{c.skipped_unsubscribed} unsubscribed, skipped</span>}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-cream-400 text-sm">Nothing sent yet.</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
