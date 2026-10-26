import "server-only";
import { POLICIES, type PolicyKey } from "@/lib/policies";
import { createAdminClient } from "@/lib/supabase/admin";

type Context = "signup" | "seller_signup" | "checkout" | "membership";

/** Records that a person accepted the current version of one or more policies. Never throws. */
export async function recordAcceptance(
  userId: string,
  policies: PolicyKey[],
  context: Context,
  opts: { orderId?: string; membershipId?: string; request?: Request } = {}
) {
  try {
    const userAgent = opts.request?.headers.get("user-agent")?.slice(0, 300) ?? null;
    const rows = policies.map((p) => ({
      user_id: userId,
      policy: p,
      version: POLICIES[p].version,
      context,
      order_id: opts.orderId ?? null,
      membership_id: opts.membershipId ?? null,
      user_agent: userAgent,
    }));
    const { error } = await createAdminClient().from("policy_acceptances").insert(rows);
    if (error) console.error("[policies] couldn't record acceptance", error);
  } catch (err) {
    console.error("[policies] couldn't record acceptance", err);
  }
}
