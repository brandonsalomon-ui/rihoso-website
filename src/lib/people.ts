/**
 * The people of RIHOSO, shown on /people in this order.
 * photo: put the image in /public/people/ and set e.g. "/people/mitchel-thompson.jpg".
 *        Until then the card shows the person's initials.
 * bio:   optional short paragraph shown under the title.
 */
export type Person = {
  name: string;
  title: string;
  photo?: string;
  bio?: string;
};

export const PEOPLE: Person[] = [
  { name: "Mitchel Thompson", title: "Master Watchmaker" },
  { name: "Brandon Salomon", title: "Founder" },
  { name: "Jeff Padwa", title: "Legal Counsel" },
  { name: "Walter Neary", title: "Horological Expert & Advisor" },
  { name: "Aiden Short", title: "Watchmaker in Training & Horological Expert" },
  { name: "Gideon Bodey", title: "Master Watchmaker & Expert Horologist" },
  { name: "Evan Saltzman", title: "Watchmaking Expert & Proprietor of Saltzman's Watches" },
  { name: "Francesca Matarese", title: "Events & Planning" },
];

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
