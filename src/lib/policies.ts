// Versions of the public policies people accept. Bump a version when its text changes.
// The text lives in src/content/policies/*.md and is shown at /terms, /seller-agreement,
// /membership-terms and /privacy. Status: DRAFT pending legal review.

export const POLICY_STATUS = "draft" as const;

export const POLICIES = {
  terms: { title: "Website and Watch Exchange Terms of Use", href: "/terms", version: "2026-10-26-draft" },
  seller: { title: "Seller Agreement", href: "/seller-agreement", version: "2026-10-26-draft" },
  membership: { title: "Membership and Event Terms", href: "/membership-terms", version: "2026-10-26-draft" },
  privacy: { title: "Privacy Policy", href: "/privacy", version: "2026-10-26-draft" },
} as const;

export type PolicyKey = keyof typeof POLICIES;

/** How long buyers have to inspect after verified receipt or handover. */
export const INSPECTION_HOURS = 72;
/** Seller must ship within this many business days of payment. */
export const SHIP_BUSINESS_DAYS = 3;
/** Pickup must happen within this many calendar days of payment, or the order may be cancelled and refunded. */
export const PICKUP_DAYS = 7;
/** Seller has this many business days after a verified return arrives to report a problem. */
export const RETURN_REVIEW_BUSINESS_DAYS = 2;
/** Members can ask for a full refund of dues within this many days if no benefit was used. */
export const DUES_REFUND_DAYS = 14;
