export const MEMBERSHIP_TIERS = [
  {
    id: "individual",
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
    id: "family",
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
    id: "patron",
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
] as const;

export type TierId = (typeof MEMBERSHIP_TIERS)[number]["id"];
