import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import SellerSignup from "@/components/SellerSignup";

export const metadata: Metadata = {
  title: "Sell a Watch",
  description: "Set up your RIHOSO Watch Exchange seller account.",
};

export default function SellPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <>
      <PageHero
        eyebrow="Watch Exchange"
        title="Become a Seller"
        subtitle="Set up your seller account once, then list as many watches as you like."
      />
      <section className="py-20 sm:py-24 bg-forest-800">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          {searchParams.error === "link" && (
            <p className="mb-8 text-sm text-red-300 bg-red-900/30 border border-red-400/30 rounded px-4 py-3" role="alert">
              That sign-up link is no longer valid. Please start again below.
            </p>
          )}
          <SellerSignup />
        </div>
      </section>
    </>
  );
}
