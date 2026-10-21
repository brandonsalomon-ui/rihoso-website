import type { Metadata } from "next";
import Link from "next/link";
import MembershipSignup from "@/components/MembershipSignup";

export const metadata: Metadata = {
  title: "Memberships",
  description: "Join the Rhode Island Horological Society. Explore membership tiers and benefits.",
};

export default function MembershipsPage() {
  return (
    <section className="py-20 bg-forest-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-gold-400 text-sm uppercase tracking-[0.2em] mb-2 text-center">
          Join the Society
        </p>
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-cream-50 mb-4 text-center">
          Membership
        </h1>
        <p className="text-center text-cream-300 mb-16 max-w-2xl mx-auto">
          Become part of a community dedicated to preserving the art and science of horology.
        </p>

        <MembershipSignup />

        <div className="mt-12 text-center">
          <p className="text-cream-400 text-sm">
            Questions about membership?{" "}
            <Link href="/contact" className="text-gold-400 hover:text-gold-300 transition-colors">
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
