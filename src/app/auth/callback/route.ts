import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Finishes email sign-in. Supports both link styles:
 *  - ?token_hash=…&type=email  (works even if the link is opened in a different browser)
 *  - ?code=…                   (PKCE; must be opened in the browser that requested it)
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const nextParam = searchParams.get("next") ?? "/marketplace/account";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/marketplace/account";
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;
  const code = searchParams.get("code");
  const supabase = createClient();

  let error: unknown = "missing token";
  if (tokenHash) {
    ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
  } else if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  }
  if (!error) return NextResponse.redirect(`${origin}${next}`);

  console.error("[auth] sign-in link failed", error);
  return NextResponse.redirect(`${origin}/marketplace/sign-in?error=link&next=${encodeURIComponent(next)}`);
}
