import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { EVENTS, todayInRI, type SocietyEvent } from "@/lib/events";

export type RsvpInput = {
  slug: string;
  name: string;
  email: string;
  phone: string;
  saysMember: boolean;
  guests: number;
};

export type RsvpRow = {
  id: string;
  event_slug: string;
  full_name: string;
  email: string;
  phone: string | null;
  says_member: boolean;
  member_verified: boolean;
  guests: number;
  created_at: string;
};

/** The event taking RSVPs under this slug, and whether RSVPs are still open. */
export function findRsvpEvent(slug: string): { event: SocietyEvent; open: boolean } | null {
  const event = EVENTS.find((e) => e.rsvp?.slug === slug);
  if (!event?.rsvp) return null;
  return { event, open: todayInRI() <= event.rsvp.closesOn };
}

/** True when this email belongs to a signed-up Exchange user marked as a RIHOSO member. */
async function isVerifiedMember(email: string) {
  const admin = createAdminClient();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data) return false;
    const user = data.users.find((u) => u.email?.toLowerCase() === email);
    if (user) {
      const { data: profile } = await admin.from("profiles").select("is_member").eq("id", user.id).maybeSingle();
      return Boolean(profile?.is_member);
    }
    if (data.users.length < 1000) return false;
  }
  return false;
}

/**
 * Saves (or updates) an RSVP. Returns the saved row plus the running totals for the
 * event, or null if the database isn't reachable — the caller still emails it.
 */
export async function saveRsvp(input: RsvpInput) {
  try {
    const admin = createAdminClient();
    const memberVerified = await isVerifiedMember(input.email).catch(() => false);
    const { error } = await admin.from("event_rsvps").upsert(
      {
        event_slug: input.slug,
        full_name: input.name,
        email: input.email,
        phone: input.phone || null,
        says_member: input.saysMember,
        member_verified: memberVerified,
        guests: input.guests,
      },
      { onConflict: "event_slug,email" }
    );
    if (error) throw error;
    const { data } = await admin.from("event_rsvps").select("guests").eq("event_slug", input.slug);
    const rows = data ?? [];
    return {
      memberVerified,
      rsvps: rows.length,
      people: rows.reduce((sum, r) => sum + 1 + (r.guests ?? 0), 0),
    };
  } catch (err) {
    console.error("[rsvp] could not save to the database", err);
    return null;
  }
}
