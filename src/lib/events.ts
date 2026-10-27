import { PHOTOS, type Photo } from "@/lib/photos";

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
  /** Small tag next to the date, e.g. "Members". */
  badge?: string;
  /** Photos shown with the event; the first one also leads the home-page card. */
  photos?: Photo[];
  /** Optional call to action shown under the details. */
  link?: { href: string; label: string };
  /** Turns on the RSVP form. `slug` keys the saved RSVPs; `closesOn` is the last day to RSVP (YYYY-MM-DD). */
  rsvp?: { slug: string; closesOn: string };
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
export const EVENTS: SocietyEvent[] = [
  {
    title: "Late Fall Members' Meet-Up at Capriccio",
    shortTitle: "Late Fall Meet-Up at Capriccio",
    date: "Tuesday, November 24, 2026",
    endsOn: "2026-11-24",
    time: "7:00 – 9:00 PM",
    location: "Capriccio (bar area), 2 Pine Street, Providence",
    badge: "Members",
    description:
      "Close out the season with friends and fine watches in the candlelit bar at Capriccio, the downtown Providence landmark on the Riverwalk. Wear something from your collection, talk shop with working watchmakers, and get a first look at the new RIHOSO Watch Exchange, the Society's marketplace for buying and selling fine watches.",
    shortDescription:
      "Friends, fine watches, and watchmakers in the bar at Capriccio, plus a first look at our new Watch Exchange.",
    photos: [PHOTOS.capriccioBar, PHOTOS.capriccioAwning, PHOTOS.membersWatches, PHOTOS.demoConversation, PHOTOS.membersMingle],
    link: { href: "/marketplace", label: "Preview the Watch Exchange" },
    rsvp: { slug: "capriccio-2026-11-24", closesOn: "2026-11-20" },
  },
  {
    title: "Monthly Meetings Begin",
    date: "January 2027",
    endsOn: "2027-01-31",
    time: "Date & time to be announced",
    location: "Rhode Island",
    description:
      "Starting in January 2027, RIHOSO will meet every month. Members will be the first to receive the date, time, and location.",
    shortDescription: "Starting in January 2027, RIHOSO will meet every month.",
  },
];

/** Today's date in Rhode Island as YYYY-MM-DD. */
export function todayInRI(now = new Date()) {
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
