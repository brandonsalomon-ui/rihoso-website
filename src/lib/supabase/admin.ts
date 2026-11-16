import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

/**
 * Service-role client: bypasses row-level security. Use ONLY on the server for
 * trusted writes (seller Stripe accounts, orders, member status, service requests).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) throw new Error("Supabase service role is not configured");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Looks up a user's sign-in email (for notifications). */
export async function getUserEmail(userId: string) {
  const { data } = await createAdminClient().auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

/**
 * Finds the account for an email, or creates one (no password; they sign in later with an emailed code).
 * Used where someone pays without signing in first, e.g. sponsoring an event from a QR code.
 */
export async function findOrCreateUserByEmail(email: string, meta: Record<string, string>) {
  const admin = createAdminClient();
  const normalized = email.trim().toLowerCase();
  const { data: created, error } = await admin.auth.admin.createUser({
    email: normalized,
    email_confirm: true,
    user_metadata: meta,
  });
  if (created?.user) return created.user.id;
  // Already has an account: look it up.
  for (let page = 1; page <= 20; page++) {
    const { data, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (listError) throw listError;
    const match = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (match) return match.id;
    if (data.users.length < 1000) break;
  }
  throw error ?? new Error("Couldn't create or find an account for this email");
}
