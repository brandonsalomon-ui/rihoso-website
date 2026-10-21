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
// the day after its `endsOn` date.
export const EVENTS: SocietyEvent[] = [
  {
    title: "Monthly Meeting & Show-and-Tell",
    shortTitle: "Monthly Members Meeting",
    date: "First Thursday of Every Month",
    time: "7:00 PM",
    location: "Rhode Island",
    description:
      "Our regular monthly meeting. Bring your latest acquisitions, restorations, and questions for the group. All skill levels welcome.",
    shortDescription:
      "Join fellow horologists for discussions, show-and-tell, and guest presentations.",
    recurring: true,
  },
  {
    title: "Spring Horological Fair",
    date: "April 12, 2026",
    endsOn: "2026-04-12",
    time: "9:00 AM - 4:00 PM",
    location: "Providence, RI",
    description:
      "Annual spring gathering featuring dealers, collectors, and exhibitors. Browse vintage and modern timepieces, tools, parts, and horological literature.",
    shortDescription: "Our signature event featuring vendors, exhibits, and educational workshops.",
  },
  {
    title: "Watchmaking Workshop: Movement Basics",
    shortTitle: "Watchmaking Workshop",
    date: "May 17, 2026",
    endsOn: "2026-05-17",
    time: "10:00 AM - 2:00 PM",
    location: "TBA",
    description:
      "Hands-on workshop covering the fundamentals of mechanical watch movements. Limited spots available. Open to members and guests.",
    shortDescription: "Hands-on workshop covering movement assembly, cleaning, and maintenance.",
  },
  {
    title: "Summer Clock Tour",
    date: "June 2026",
    endsOn: "2026-06-30",
    time: "TBA",
    location: "Various Locations, RI",
    description:
      "Guided tour of historic public clocks and clock towers throughout Rhode Island. Learn the history behind these magnificent timepieces.",
  },
  {
    title: "Annual Holiday Dinner",
    date: "December 2026",
    endsOn: "2026-12-31",
    time: "6:00 PM",
    location: "TBA",
    description:
      "Our annual year-end celebration. Join fellow members for dinner, awards, and camaraderie.",
    shortDescription: "Our year-end celebration with dinner, awards, and camaraderie.",
  },
];

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
