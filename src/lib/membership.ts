export const MEMBERSHIP_TIERS = [
  {
    id: "member",
    name: "Member",
    price: "$120",
    period: "per year",
    features: [
      "Monthly meeting access",
      "Newsletter subscription",
      "Show-and-tell participation",
      "Member directory listing",
      "Discounted event tickets",
      "5% Watch Exchange selling fee (instead of 10%)",
    ],
    highlighted: true,
  },
] as const;

export type TierId = (typeof MEMBERSHIP_TIERS)[number]["id"];

/** Online membership: one payment covers this many months; it does not renew automatically. */
export const MEMBERSHIP_PRICE_CENTS = 12000;
export const MEMBERSHIP_TERM_MONTHS = 12;
