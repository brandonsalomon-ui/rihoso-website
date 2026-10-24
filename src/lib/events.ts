export type SocietyEvent = {
  title: string;
  shortTitle?: string;
  /** Label shown on the site, e.g. "April 12, 2026" or "June 2026". */
  date: string;
  /** Last day the event should be listed (YYYY-MM-DD). Omit for recurring events. */
  endsOn?: string;
  time: string;
  location: string;
  description: string;
  shortDescription?: string;
  recurring?: boolean;
};

// Add new events here. Each dated event disappears from the site automatically
// the day after its `endsOn` date. While this list is empty, the Events page and
// the home page show a "no gatherings scheduled" message instead.
//
// Example:
//   {
//     title: "Spring Gathering",
//     date: "April 16, 2027",
//     endsOn: "2027-04-16",
//     time: "6:00 PM",
//     location: "University Club, Providence",
//     description: "An evening of watches, conversation, and a watchmaking demonstration.",
//   },
//
// For a monthly meeting, set `recurring: true` (and leave out `endsOn`); the site
// then also shows the next first-Thursday date.
export const EVENTS: SocietyEvent[] = [];

/** Today's date in Rhode Island as YYYY-MM-DD. */
function todayInRI(now = new Date()) {
  return now.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

export function upcomingEvents(now = new Date()) {
  const today = todayInRI(now);
  return EVENTS.filter((e) => e.recurring || !e.endsOn || e.endsOn >= today);
}

/** Next first-Thursday-of-the-month meeting date, e.g. "Thursday, November 5". */
export function nextMonthlyMeeting(now = new Date()) {
  const today = todayInRI(now);
  let [y, m] = today.split("-").map(Number);
  for (let i = 0; i < 3; i++) {
    const first = new Date(Date.UTC(y, m - 1, 1));
    const offset = (4 - first.getUTCDay() + 7) % 7; // 4 = Thursday
    const d = new Date(Date.UTC(y, m - 1, 1 + offset));
    const iso = d.toISOString().slice(0, 10);
    if (iso >= today) {
      return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
    }
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return null;
}
