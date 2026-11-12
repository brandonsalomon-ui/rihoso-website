// The RIHOSO Monthly: the fixed list of sections, in the order they appear.
// Shared by the server (validation, email, pages) and the admin editor, so no server-only imports here.

export type SectionKey =
  | "store"
  | "releases"
  | "world_events"
  | "news"
  | "watchmaker"
  | "independent"
  | "mainstream"
  | "rihoso_event"
  | "repair"
  | "exchange"
  | "refer"
  | "clinic"
  | "restaurant"
  | "whiskey"
  | "wine"
  | "travel"
  | "editorial";

export type SectionDef = {
  key: SectionKey;
  /** Section label shown above the title, e.g. "Local Store Spotlight". */
  label: string;
  /** What the writer should put here (shown to Brandon in the editor too). */
  guide: string;
  /** Photo slots Brandon fills on the admin page. */
  photos: number;
  /** Does the writer need web sources for this section? */
  sourced: boolean;
  /** Shorter sections RIHOSO writes itself (repair, exchange, referral, clinic). */
  minBody: number;
  group: "feature" | "world" | "society" | "good_life" | "editorial";
};

export const SECTIONS: SectionDef[] = [
  { key: "store", label: "Local Store Spotlight", guide: "A local (Rhode Island / southern New England) watch store or independent watch business: who they are, history, what makes them worth a visit, address. Two photos.", photos: 2, sourced: true, minBody: 500, group: "feature" },
  { key: "releases", label: "New Releases", guide: "5 to 10 notable watches released or announced in the past month: brand, model, reference, what's new, price where published. One short paragraph or bullet each.", photos: 0, sourced: true, minBody: 900, group: "world" },
  { key: "world_events", label: "Around the Watch World", guide: "Watch events held around the world this past month (Dubai Watch Week, Geneva, New York and others): what happened, who was there, highlights. Plus notable events coming up.", photos: 0, sourced: true, minBody: 600, group: "world" },
  { key: "news", label: "News, Accomplishments & Awards", guide: "Industry news, brand accomplishments, awards (e.g. GPHG), records and auction results from the past month.", photos: 0, sourced: true, minBody: 500, group: "world" },
  { key: "watchmaker", label: "Watchmaker Profile", guide: "A watchmaker, historic or living: background, training, accomplishments, inventions, awards. Professional facts only.", photos: 0, sourced: true, minBody: 800, group: "feature" },
  { key: "independent", label: "Independent Spotlight", guide: "An independent watch brand: founder, philosophy, signature pieces, why collectors care.", photos: 0, sourced: true, minBody: 700, group: "feature" },
  { key: "mainstream", label: "Brand in Focus", guide: "A major brand in the news this month (a release, anniversary or story) and why it matters.", photos: 0, sourced: true, minBody: 600, group: "feature" },
  { key: "rihoso_event", label: "From the Society", guide: "A recap of RIHOSO's most recent event: where, when, who came, what was shown and discussed. One photo.", photos: 1, sourced: false, minBody: 300, group: "society" },
  { key: "repair", label: "Repair Corner", guide: "A short repair highlight plus why having your watch checked or serviced matters, and that RIHOSO can do it or point you to the right place.", photos: 0, sourced: false, minBody: 250, group: "society" },
  { key: "exchange", label: "The Watch Exchange", guide: "Have a watch to sell or trade? List it on the RIHOSO Watch Exchange. Members save on the transaction fee (5% instead of 10%).", photos: 0, sourced: false, minBody: 150, group: "society" },
  { key: "refer", label: "Bring a Friend", guide: "Ask members to refer friends who love watches; a membership makes a great gift.", photos: 0, sourced: false, minBody: 150, group: "society" },
  { key: "clinic", label: "Gift a Watchmaking Clinic", guide: "A short blurb on why a RIHOSO Watchmaking Clinic makes a great gift.", photos: 0, sourced: false, minBody: 150, group: "society" },
  { key: "restaurant", label: "Where We're Eating", guide: "A local restaurant RIHOSO likes (Rhode Island first): what to order, the room, why it suits a watch evening.", photos: 0, sourced: true, minBody: 300, group: "good_life" },
  { key: "whiskey", label: "In the Glass: Whiskey", guide: "A whiskey we recommend: distillery, style, tasting notes, approximate price.", photos: 0, sourced: true, minBody: 250, group: "good_life" },
  { key: "wine", label: "In the Glass: Wine", guide: "A wine we recommend: producer, region, vintage if relevant, tasting notes, approximate price.", photos: 0, sourced: true, minBody: 250, group: "good_life" },
  { key: "travel", label: "Destination", guide: "A travel destination spotlight, ideally with a horological angle (a museum, a manufacture, a watch street).", photos: 0, sourced: true, minBody: 400, group: "good_life" },
  { key: "editorial", label: "The State of the Watch World", guide: "RIHOSO's editorial on where the watch world stands: market, trends, what to watch for.", photos: 0, sourced: true, minBody: 1200, group: "editorial" },
];

export const SECTION_KEYS = SECTIONS.map((s) => s.key);
export const sectionDef = (key: string) => SECTIONS.find((s) => s.key === key);

export const GROUP_LABEL: Record<SectionDef["group"], string> = {
  feature: "Features",
  world: "The Watch World",
  society: "From RIHOSO",
  good_life: "The Good Life",
  editorial: "Editorial",
};

export type NewsletterPhoto = { path: string; caption: string; credit: string };
export type NewsletterSource = { title: string; url: string };
export type NewsletterSection = {
  key: SectionKey;
  /** The subject of the section, e.g. the store's or watchmaker's name. */
  title: string;
  /** One or two sentences for the email teaser. */
  blurb: string;
  /** Full text, plain Markdown. */
  body: string;
  photos: NewsletterPhoto[];
  sources: NewsletterSource[];
};

export const PHOTO_BUCKET = "newsletter-photos";

export function issueMonthLabel(issueDate: string) {
  const [y, m] = issueDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}
