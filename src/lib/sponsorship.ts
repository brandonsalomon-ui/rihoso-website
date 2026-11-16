// "Sponsor Tonight's Event": paid on the spot (QR code on posters at events) at rihoso.com/sponsor.
// Each sponsorship includes a RIHOSO membership for SPONSOR_TERM_MONTHS.

export const SPONSOR_LEVELS = [
  {
    id: "partial",
    name: "Partial Sponsor",
    cents: 25000,
    price: "$250",
    blurb: "Help cover tonight's gathering.",
  },
  {
    id: "full",
    name: "Full Sponsor",
    cents: 50000,
    price: "$500",
    blurb: "Underwrite tonight's gathering in full, and be named at the event.",
  },
] as const;

export type SponsorLevelId = (typeof SPONSOR_LEVELS)[number]["id"];

export function sponsorLevel(id: unknown) {
  return SPONSOR_LEVELS.find((l) => l.id === id) ?? null;
}

/** Membership included with every sponsorship. */
export const SPONSOR_TERM_MONTHS = 24;
