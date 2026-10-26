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
