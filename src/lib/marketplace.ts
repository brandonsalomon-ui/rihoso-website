// RIHOSO Watch Exchange — business rules in one place.

/** RIHOSO's commission on a completed sale, as a fraction of the sale price. */
export const COMMISSION = {
  standard: 0.1, // 10% for non-members
  member: 0.05, // 5% for RIHOSO members
} as const;

/**
 * Repairs: per the revised terms, keep this off for launch until the repair provider, insurance for
 * customers' watches, the written service order and warranty are settled. Set to false to hide the
 * repair offer and stop new requests (existing requests and payments keep working).
 */
export const REPAIRS_OPEN = true;

/** Fixed-price services RIHOSO offers alongside the marketplace. */
export const SERVICES = {
  validation: {
    name: "Member Validation",
    priceCents: 10000, // $100
    summary:
      "An experienced RIHOSO member examines the watch and reports on its condition, originality and authenticity markers.",
  },
  repair: {
    name: "Repair & Service",
    priceCents: null, // quoted per watch after inspection
    summary: "Servicing and repair by RIHOSO's watchmaking network, priced by written quote after inspection.",
  },
} as const;

/** What a listing needs before it can be published (enforced in the form and the database). */
export const LISTING_RULES = {
  minPhotos: 3,
  minDescription: 80, // characters — roughly two sentences
} as const;

export function commissionCents(salePriceCents: number, isMember: boolean) {
  const rate = isMember ? COMMISSION.member : COMMISSION.standard;
  return Math.round(salePriceCents * rate);
}

export function formatUsd(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "usd" });
}
