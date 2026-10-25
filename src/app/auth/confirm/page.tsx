"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";

function safeNext(raw: string | null) {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/marketplace/account";
}

/**
 * Landing page for email sign-in links.
 *
 * The email links here with a token_hash and we only use it when the member presses
 * "Sign in". Corporate email scanners open links automatically to check them; because
 * nothing happens until a real person clicks the button, those scans can't use up the link.
 */
export default function ConfirmPage() {
  const [state, setState] = useState<"loading" | "ready" | "working" | "error">("loading");
  const [error, setError] = useState("");
  const [params, setParams] = useState<{ tokenHash: string; type: EmailOtpType; next: string } | null>(null);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const next = safeNext(search.get("next"));

    const tokenHash = search.get("token_hash");
    if (tokenHash) {
      setParams({ tokenHash, type: (search.get("type") as EmailOtpType) || "email", next });
      setState("ready");
      return;
    }
    const code = search.get("code");
    if (code) {
      window.location.replace(`/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`);
      return;
    }
    const failure = hash.get("error_description") || search.get("error_description");
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    if (failure || !access_token || !refresh_token) {
      setError(failure || "This sign-in link is missing information.");
      setState("error");
      return;
    }
    (async () => {
      const { error } = await createClient().auth.setSession({ access_token, refresh_token });
      if (error) {
        setError(error.message);
        setState("error");
      } else window.location.replace(next);
    })();
  }, []);

  async function signIn() {
    if (!params) return;
    setState("working");
    const { error } = await createClient().auth.verifyOtp({ token_hash: params.tokenHash, type: params.type });
    if (error) {
      setError(error.message);
      setState("error");
      return;
    }
    window.location.replace(params.next);
  }

  return (
    <section className="py-24 bg-forest-800 min-h-[60vh]">
      <div className="max-w-md mx-auto px-4 text-center panel-lux rounded-xl p-8" role="status">
        {state === "error" ? (
          <>
            <h1 className="text-2xl font-display text-cream-50 mb-3">That link didn&apos;t work</h1>
            <p className="text-cream-300 mb-6">
              Sign-in links can only be used once and expire after an hour. Please request a new one — or type the
              6-digit code from the email on the sign-in page.
            </p>
            <Link href="/marketplace/sign-in" className="btn-gold inline-block px-8 py-3 font-semibold">Get a new link</Link>
          </>
        ) : state === "ready" || state === "working" ? (
          <>
            <h1 className="text-2xl font-display text-cream-50 mb-3">Welcome to the Watch Exchange</h1>
            <p className="text-cream-300 mb-6">Press the button to finish signing in.</p>
            <button onClick={signIn} disabled={state === "working"} className="btn-gold px-10 py-3 rounded font-semibold disabled:opacity-60">
              {state === "working" ? "Signing in…" : "Sign in"}
            </button>
          </>
        ) : (
          <p className="text-cream-200">Signing you in…</p>
        )}
      </div>
    </section>
  );
}
