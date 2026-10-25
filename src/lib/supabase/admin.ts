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
