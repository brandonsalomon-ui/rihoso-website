// Repair partner program rules, safe to use in the browser and on the server.

/** Annual partner sponsorship. */
export const PARTNER_PRICE_CENTS = 50000;
export const PARTNER_TERM_MONTHS = 12;
/** Workshops are asked to quote within this many hours. */
export const QUOTE_WINDOW_HOURS = 48;
/** A partner can renew this many days before their year ends. */
export const RENEW_WINDOW_DAYS = 30;

/** RIHOSO's referral fee, included in the workshop's quoted price: $25 under $300, $50 at $300 and up. */
export function referralFeeCents(priceCents: number) {
  return priceCents >= 30000 ? 5000 : 2500;
}

export const FEE_SCHEDULE_TEXT = "$25 on repairs under $300, $50 on repairs of $300 or more";

export const JOB_STATUSES = [
  { value: "accepted", label: "Chosen — contact the customer" },
  { value: "received", label: "Watch received" },
  { value: "in_progress", label: "Work in progress" },
  { value: "complete", label: "Complete — returned to customer" },
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number]["value"];

export function jobStatusLabel(s: string | null | undefined) {
  return JOB_STATUSES.find((j) => j.value === s)?.label ?? "";
}
