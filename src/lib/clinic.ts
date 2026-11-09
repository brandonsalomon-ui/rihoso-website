// Watchmaking Clinic pricing and options. Safe to import in the browser and on the server;
// the server always recalculates the price from these rules before taking payment.

export const CLINIC_PRICE = {
  /** Per seat, in cents. */
  standardCents: 7500,
  /** Per seat for a guest who is a verified RIHOSO member, in cents. */
  memberCents: 5000,
  /** Every booking pays for at least this many seats. */
  minimumSeats: 4,
  /** Largest group that can be booked online. Bigger groups use the inquiry form. */
  maximumSeats: 40,
} as const;

/** Name used for a seat whose guest isn't known yet. Always charged the standard rate. */
export const TBD = "TBD";

export const OCCASIONS = [
  { value: "anniversary", label: "Anniversary" },
  { value: "birthday", label: "Birthday" },
  { value: "graduation", label: "Graduation" },
  { value: "work_event", label: "Work event" },
  { value: "holiday_gift", label: "Holiday gift" },
  { value: "other", label: "Other" },
] as const;

export type Occasion = (typeof OCCASIONS)[number]["value"];

export function isOccasion(value: string): value is Occasion {
  return OCCASIONS.some((o) => o.value === value);
}

export function occasionLabel(value: string | null | undefined) {
  return OCCASIONS.find((o) => o.value === value)?.label ?? "";
}

/**
 * Prices a guest list: each verified member seat is $50, every other seat $75,
 * and empty seats up to the 4-seat minimum are added as TBD at $75.
 */
export function priceGuests(guests: { member: boolean }[]) {
  const memberSeats = guests.filter((g) => g.member).length;
  const seats = Math.max(CLINIC_PRICE.minimumSeats, guests.length);
  const standardSeats = seats - memberSeats;
  const totalCents = memberSeats * CLINIC_PRICE.memberCents + standardSeats * CLINIC_PRICE.standardCents;
  return { seats, memberSeats, standardSeats, totalCents };
}

export function dollars(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0 })}`;
}
