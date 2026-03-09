import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events & Gatherings",
  description: "Upcoming RIHOSO events, meetings, and horological gatherings in Rhode Island.",
};

const events = [
  {
    title: "Monthly Meeting & Show-and-Tell",
    date: "First Thursday of Every Month",
    time: "7:00 PM",
    location: "Rhode Island",
    description:
      "Our regular monthly meeting. Bring your latest acquisitions, restorations, and questions for the group. All skill levels welcome.",
    recurring: true,
  },
  {
    title: "Spring Horological Fair",
    date: "April 12, 2026",
    time: "9:00 AM - 4:00 PM",
    location: "Providence, RI",
    description:
      "Annual spring gathering featuring dealers, collectors, and exhibitors. Browse vintage and modern timepieces, tools, parts, and horological literature.",
    recurring: false,
  },
  {
    title: "Watchmaking Workshop: Movement Basics",
    date: "May 17, 2026",
    time: "10:00 AM - 2:00 PM",
    location: "TBA",
    description:
      "Hands-on workshop covering the fundamentals of mechanical watch movements. Limited spots available. Open to members and guests.",
    recurring: false,
  },
  {
    title: "Summer Clock Tour",
    date: "June 2026",
    time: "TBA",
    location: "Various Locations, RI",
    description:
      "Guided tour of historic public clocks and clock towers throughout Rhode Island. Learn the history behind these magnificent timepieces.",
    recurring: false,
  },
  {
    title: "Annual Holiday Dinner",
    date: "December 2026",
    time: "6:00 PM",
    location: "TBA",
    description:
      "Our annual year-end celebration. Join fellow members for dinner, awards, and camaraderie.",
    recurring: false,
  },
];

export default function EventsPage() {
  return (
    <section className="py-20 bg-forest-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-gold-400 text-sm uppercase tracking-[0.2em] mb-2 text-center">
          Mark Your Calendar
        </p>
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-cream-50 mb-4 text-center">
          Events &amp; Gatherings
        </h1>
        <p className="text-center text-cream-300 mb-12 max-w-2xl mx-auto">
          Join us for meetings, workshops, fairs, and social events throughout the year.
        </p>

        <div className="space-y-6">
          {events.map((event, i) => (
            <div
              key={i}
              className="bg-forest-800/60 border border-forest-600/30 rounded-lg p-6 hover:border-gold-400/30 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="sm:w-48 shrink-0">
                  <p className="text-gold-400 font-semibold text-sm">{event.date}</p>
                  <p className="text-cream-400 text-sm">{event.time}</p>
                  {event.recurring && (
                    <span className="inline-block mt-1 text-xs bg-gold-400/20 text-gold-300 px-2 py-0.5 rounded">
                      Recurring
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-display text-cream-100 mb-2">{event.title}</h3>
                  <p className="text-sm text-cream-300 mb-2">{event.description}</p>
                  <p className="text-xs text-cream-400">{event.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
