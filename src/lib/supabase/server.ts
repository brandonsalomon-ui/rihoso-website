import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

/** Supabase client acting as the signed-in visitor (row-level security applies). */
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — the middleware refreshes sessions instead.
        }
      },
    },
  });
}

export async function getUser() {
  // Until the database is connected, Watch Exchange pages fall back to the overview.
  if (!isSupabaseConfigured()) redirect("/marketplace");
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}
