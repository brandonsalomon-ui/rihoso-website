export type Sponsor = {
  name: string;
  /** Logo file in /public/sponsors */
  logo: string;
  /** Background colour of the logo artwork, so each plaque blends with its logo. */
  bg: string;
  width: number;
  height: number;
};

// To add a sponsor: drop the logo into /public/sponsors and add a line here.
export const SPONSORS: Sponsor[] = [
  { name: "University Club", logo: "university-club.webp", bg: "#ffffff", width: 305, height: 320 },
  { name: "The Capital Grille", logo: "capital-grille.webp", bg: "#ffffff", width: 640, height: 312 },
  { name: "Audrain Automobile Museum", logo: "audrain.webp", bg: "#fefefe", width: 283, height: 178 },
  { name: "Grenon's of Newport", logo: "grenons.webp", bg: "#fefffe", width: 466, height: 320 },
  { name: "Jonathan Ucran, CPA, LLC", logo: "ucran-cpa.webp", bg: "#fefefe", width: 473, height: 120 },
  { name: "M.S. Walker Fine Wines & Spirits", logo: "ms-walker.webp", bg: "#fefefe", width: 552, height: 320 },
  { name: "Norqain", logo: "norqain.webp", bg: "#000000", width: 640, height: 267 },
  { name: "Providence Diamond", logo: "providence-diamond.webp", bg: "#ffffff", width: 640, height: 195 },
  { name: "Saltzman's Watches", logo: "saltzmans.webp", bg: "#22293b", width: 409, height: 102 },
  { name: "Speidel", logo: "speidel.webp", bg: "#ffffff", width: 337, height: 195 },
  { name: "The Savory Grape", logo: "savory-grape.webp", bg: "#fefefd", width: 350, height: 224 },
  { name: "Blueprint 5 Men's Apparel", logo: "blueprint-5.webp", bg: "#2a6fb0", width: 640, height: 213 },
  { name: "Water Treatment Solutions", logo: "water-treatment-solutions.webp", bg: "#fefefe", width: 483, height: 320 },
  { name: "Westcott Properties", logo: "westcott.webp", bg: "#31424a", width: 432, height: 320 },
  { name: "WOLF", logo: "wolf.webp", bg: "#ffffff", width: 640, height: 232 },
];
