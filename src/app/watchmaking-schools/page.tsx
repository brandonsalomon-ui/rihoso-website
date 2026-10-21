import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Watchmaking Schools",
  description: "Directory of watchmaking schools and horological education programs.",
};

const schools = [
  {
    name: "Lititz Watch Technicum",
    location: "Lititz, PA",
    description:
      "One of the most respected watchmaking schools in North America, offering a comprehensive program in watch repair and restoration.",
    website: "https://en.wikipedia.org/wiki/Lititz_Watch_Technicum",
  },
  {
    name: "NAWCC School of Horology",
    location: "Columbia, PA",
    description:
      "Programs through the National Association of Watch and Clock Collectors covering watch and clock repair fundamentals.",
    website: "https://www.nawcc.org",
  },
  {
    name: "North American Institute of Swiss Watchmaking (NAIOSW)",
    location: "Dallas, TX",
    description:
      "Swiss-certified watchmaking program training students to WOSTEP standards for careers in luxury watch service.",
    website: "https://www.naiosw.com",
  },
  {
    name: "North Seattle College — Watch Technology",
    location: "Seattle, WA",
    description:
      "Associate degree program in watch technology with hands-on training in modern and vintage timepiece servicing.",
    website: "https://northseattle.edu",
  },
  {
    name: "Oklahoma State University Institute of Technology",
    location: "Okmulgee, OK",
    description:
      "One of the longest-running watchmaking programs in the US, offering an associate degree in watch repair.",
    website: "https://osuit.edu",
  },
  {
    name: "Paris Junior College — Watchmaking & Jewelry",
    location: "Paris, TX",
    description:
      "Certificate and degree programs combining watchmaking with jewelry arts for a well-rounded horological education.",
    website: "https://www.parisjc.edu",
  },
];

export default function WatchmakingSchoolsPage() {
  return (
    <section className="py-20 bg-forest-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-gold-400 text-sm uppercase tracking-[0.2em] mb-2 text-center">
          Education
        </p>
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-cream-50 mb-4 text-center">
          Watchmaking Schools
        </h1>
        <p className="text-center text-cream-300 mb-12 max-w-2xl mx-auto">
          Interested in pursuing horology as a career or deepening your skills? Here are
          some of the top watchmaking programs in the United States.
        </p>

        <div className="space-y-6">
          {schools.map((school) => (
            <div
              key={school.name}
              className="bg-forest-800/60 border border-forest-600/30 rounded-lg p-6 hover:border-gold-400/30 transition-colors"
            >
              <h3 className="text-xl font-display text-cream-100 mb-1">{school.name}</h3>
              <p className="text-gold-400 text-sm mb-3">{school.location}</p>
              <p className="text-sm text-cream-300 mb-3">{school.description}</p>
              <a
                href={school.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gold-400 hover:text-gold-300 transition-colors"
              >
                Visit Website &rarr;
              </a>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-cream-400 text-sm">
          <p>
            Know of a school that should be listed here?{" "}
            <a href="/contact" className="text-gold-400 hover:text-gold-300 transition-colors">
              Let us know
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
