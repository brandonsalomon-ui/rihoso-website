"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

function safeNext(raw: string | null) {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/marketplace/account";
}

/**
 * Landing page for email sign-in links. The link carries the session in the URL
 * fragment (never sent to our server), so it works in whichever browser or device
 * the member opens it on.
 */
export default function ConfirmPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const next = safeNext(search.get("next"));

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
      return;
    }
    (async () => {
      const { error } = await createClient().auth.setSession({ access_token, refresh_token });
      if (error) setError(error.message);
      else window.location.replace(next);
    })();
  }, []);

  return (
    <section className="py-24 bg-forest-800 min-h-[60vh]">
      <div className="max-w-md mx-auto px-4 text-center panel-lux rounded-xl p-8" role="status">
        {error ? (
          <>
            <h1 className="text-2xl font-display text-cream-50 mb-3">That link didn&apos;t work</h1>
            <p className="text-cream-300 mb-6">
              Sign-in links can only be used once and expire after an hour. Please request a new one.
            </p>
            <Link href="/marketplace/sign-in" className="btn-gold inline-block px-8 py-3 font-semibold">Get a new link</Link>
          </>
        ) : (
          <p className="text-cream-200">Signing you in…</p>
        )}
      </div>
    </section>
  );
}
