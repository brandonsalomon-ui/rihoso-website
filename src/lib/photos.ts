export type Photo = {
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
  /** CSS object-position used when the photo is cropped into a tile. */
  focus?: string;
};

// Photos live in /public/photos. Add new ones here.
export const PHOTOS = {
  microscope: {
    src: "/photos/watchmaker-microscope.webp",
    alt: "A watchmaker works at a microscope while a member looks on",
    caption: "At the bench",
    width: 1200,
    height: 1600,
    focus: "60% 35%",
  },
  movementDemo: {
    src: "/photos/movement-demo.webp",
    alt: "A young watchmaker disassembles a movement at a demonstration table",
    caption: "Hands-on movement demonstration",
    width: 1200,
    height: 1600,
    focus: "50% 45%",
  },
  demoConversation: {
    src: "/photos/demo-conversation.webp",
    alt: "A watchmaker explains a movement to a guest holding a glass of wine",
    caption: "Talking shop with guests",
    width: 1200,
    height: 1600,
    focus: "50% 22%",
  },
  membersEvening: {
    src: "/photos/members-evening.webp",
    alt: "Members and guests mingle beneath a chandelier at a society evening",
    caption: "A members' evening",
    width: 1600,
    height: 1200,
    focus: "50% 50%",
  },
  membersDinner: {
    src: "/photos/members-dinner.webp",
    alt: "Members share dinner and conversation around a long table in a wood-panelled room",
    caption: "Dinner with fellow collectors",
    width: 1600,
    height: 1200,
    focus: "40% 50%",
  },
  presentation: {
    src: "/photos/guest-presentation.webp",
    alt: "A speaker holds up a watch during a presentation in a gallery",
    caption: "Guest presentation",
    width: 1200,
    height: 1600,
    focus: "40% 24%",
  },
  portrait: {
    src: "/photos/member-portrait.webp",
    alt: "A member in a suit wearing a wristwatch listens during an event",
    caption: "Members and guests",
    width: 1600,
    height: 1066,
    focus: "45% 40%",
  },
  capriccioBar: {
    src: "/photos/capriccio-bar.webp",
    alt: "An espresso martini on the granite bar at Capriccio in Providence",
    caption: "The bar at Capriccio",
    width: 1200,
    height: 1600,
    focus: "50% 70%",
  },
  capriccioAwning: {
    src: "/photos/capriccio-awning.webp",
    alt: "The lit Capriccio awning on Pine Street at night",
    caption: "Capriccio, 2 Pine Street",
    width: 1116,
    height: 366,
    focus: "50% 50%",
  },
  membersMingle: {
    src: "/photos/members-mingle.webp",
    alt: "Two guests smile for a photo at a RIHOSO evening while live music plays behind them",
    caption: "Friends of the Society",
    width: 1600,
    height: 1200,
    focus: "50% 40%",
  },
  crowd: {
    src: "/photos/evening-crowd.webp",
    alt: "Guests in conversation at a crowded society reception",
    caption: "Reception",
    width: 1600,
    height: 1200,
    focus: "50% 45%",
  },
} satisfies Record<string, Photo>;
