import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import MembershipSignup from "@/components/MembershipSignup";

export const metadata: Metadata = {
  title: "Memberships",
  description: "Join the Rhode Island Horological Society. Explore membership tiers and benefits.",
};

export default function MembershipsPage() {
  return (
    <>
      <PageHero
        eyebrow="Join the Society"
        title="Membership"
        subtitle="Become part of a community dedicated to preserving the art and science of horology."
      />
      <section className="py-20 sm:py-24 bg-forest-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <MembershipSignup />

          <div className="mt-12 text-center">
            <p className="text-cream-400">
              Questions about membership?{" "}
              <Link href="/contact" className="text-gold-400 hover:text-gold-300 transition-colors">
                Contact us
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
