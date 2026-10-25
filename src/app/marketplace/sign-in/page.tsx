import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PageHero from "@/components/PageHero";
import SignInForm from "@/components/exchange/SignInForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign In", robots: { index: false } };
export const dynamic = "force-dynamic";

function safeNext(next?: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/marketplace/account";
}

export default async function SignInPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  const next = safeNext(searchParams.next);
  if (isSupabaseConfigured()) {
    const { user } = await getUser();
    if (user) redirect(next);
  }
  return (
    <>
      <PageHero eyebrow="Watch Exchange" title="Sign In" subtitle="No password needed — we'll email you a secure sign-in link." />
      <section className="py-20 sm:py-24 bg-forest-800">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          {searchParams.error && (
            <p className="mb-6 text-sm text-red-300 bg-red-900/30 border border-red-400/30 rounded px-4 py-3" role="alert">
              That sign-in link has expired or was already used. Please request a new one.
            </p>
          )}
          <SignInForm next={next} />
        </div>
      </section>
    </>
  );
}
