import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Memberships",
  description: "Join the Rhode Island Horological Society. Explore membership tiers and benefits.",
};

const tiers = [
  {
    name: "Individual",
    price: "$40",
    period: "per year",
    features: [
      "Monthly meeting access",
      "Newsletter subscription",
      "Show-and-tell participation",
      "Member directory listing",
      "Discounted event tickets",
    ],
    highlighted: false,
  },
  {
    name: "Family",
    price: "$60",
    period: "per year",
    features: [
      "Everything in Individual",
      "Coverage for household members",
      "Family event pricing",
      "Youth mentorship program access",
      "Priority workshop registration",
    ],
    highlighted: true,
  },
  {
    name: "Patron",
    price: "$150",
    period: "per year",
    features: [
      "Everything in Family",
      "Recognition on sponsor page",
      "VIP seating at events",
      "Exclusive patron gatherings",
      "Complimentary fair admission",
      "Support society programs",
    ],
    highlighted: false,
  },
];

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-lg p-8 border transition-colors ${
                tier.highlighted
                  ? "bg-forest-700/60 border-gold-400/50 ring-1 ring-gold-400/20"
                  : "bg-forest-800/60 border-forest-600/30 hover:border-gold-400/30"
              }`}
            >
              {tier.highlighted && (
                <p className="text-xs text-gold-400 uppercase tracking-wider font-semibold mb-4">
                  Most Popular
                </p>
              )}
              <h3 className="text-2xl font-display text-cream-50 mb-1">{tier.name}</h3>
              <div className="mb-6">
                <span className="text-3xl font-bold text-gold-400">{tier.price}</span>
                <span className="text-cream-400 text-sm ml-1">/{tier.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-cream-300">
                    <svg className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded font-semibold transition-colors ${
                  tier.highlighted
                    ? "bg-gold-400 text-forest-950 hover:bg-gold-300"
                    : "border border-cream-200/30 text-cream-100 hover:bg-cream-100/10"
                }`}
              >
                Join Now
              </button>
            </div>
          ))}
        </div>

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
