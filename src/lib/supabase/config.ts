// Supabase connection settings for the Watch Exchange.
// Required env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
// Server-only env var: SUPABASE_SERVICE_ROLE_KEY (never exposed to the browser)

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export const PHOTO_BUCKET = "listing-photos";

/** Private bucket for photos customers attach to repair requests (shown via signed links only). */
export const REPAIR_PHOTO_BUCKET = "repair-photos";

export function photoUrl(storagePath: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${storagePath}`;
}
