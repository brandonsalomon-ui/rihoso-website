import { MAP_POINTS } from "./usMap";

export type School = {
  name: string;
  location: string;
  description: string;
  website: string;
  /** Short label shown as a chip on the card. */
  focus: string;
  /** True location on the map (see lib/usMap.ts). */
  point: readonly [number, number];
  /** Where the numbered pin is drawn, when it has to be nudged off a neighbour. */
  pinAt?: readonly [number, number];
};

// To add a school: add an entry here. For the map pin, add its longitude/latitude to
// the generator described in lib/usMap.ts, or reuse the nearest existing point.
export const SCHOOLS: School[] = [
  {
    name: "Lititz Watch Technicum",
    location: "Lititz, PA",
    description:
      "One of the most respected watchmaking schools in North America, offering a comprehensive program in watch repair and restoration.",
    website: "https://en.wikipedia.org/wiki/Lititz_Watch_Technicum",
    focus: "Repair & restoration",
    point: MAP_POINTS.lititz,
    pinAt: [856, 218],
  },
  {
    name: "NAWCC School of Horology",
    location: "Columbia, PA",
    description:
      "Programs through the National Association of Watch and Clock Collectors covering watch and clock repair fundamentals.",
    website: "https://www.nawcc.org",
    focus: "Watch & clock repair",
    point: MAP_POINTS.columbia,
    pinAt: [812, 262],
  },
  {
    name: "North American Institute of Swiss Watchmaking (NAIOSW)",
    location: "Dallas, TX",
    description:
      "Swiss-certified watchmaking program training students to WOSTEP standards for careers in luxury watch service.",
    website: "https://www.naiosw.com",
    focus: "WOSTEP standards",
    point: MAP_POINTS.dallas,
    pinAt: [470, 452],
  },
  {
    name: "North Seattle College — Watch Technology",
    location: "Seattle, WA",
    description:
      "Associate degree program in watch technology with hands-on training in modern and vintage timepiece servicing.",
    website: "https://northseattle.edu",
    focus: "Associate degree",
    point: MAP_POINTS.seattle,
  },
  {
    name: "Oklahoma State University Institute of Technology",
    location: "Okmulgee, OK",
    description:
      "One of the longest-running watchmaking programs in the US, offering an associate degree in watch repair.",
    website: "https://osuit.edu",
    focus: "Associate degree",
    point: MAP_POINTS.okmulgee,
  },
  {
    name: "Paris Junior College — Watchmaking & Jewelry",
    location: "Paris, TX",
    description:
      "Certificate and degree programs combining watchmaking with jewelry arts for a well-rounded horological education.",
    website: "https://www.parisjc.edu",
    focus: "Certificate & degree",
    point: MAP_POINTS.paris,
    pinAt: [534, 410],
  },
];
