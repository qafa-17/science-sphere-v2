// The editors, for Meet the Team and their ID cards.
// Fun facts in [brackets] are placeholders until each person sends theirs.

export type Member = {
  id: string;
  name: string;
  /** how the role reads on the team page, e.g. "editor. writer. socials." */
  role: string;
  /** what they look after */
  expertise: string[];
  /** e.g. "BSc in Computer Science"; each item is its own line on the card */
  degree: string[];
  bio: string;
  fact: string;
  /** a made-up 6-digit ID number for the card */
  idNumber: string;
  /** a made-up 13-character serial for the back of the card */
  serial: string;
  /** black and white head (top of head to chin), for the team page */
  photo: string;
  /** black and white head and shoulders, for the ID card */
  cardPhoto: string;
  /** which side of the team page their face sits on */
  side: "left" | "right";
  /** how wide their head image is compared to its height, for the team page */
  faceAspect: number;
  /** how tall their head image is compared to the tallest one; every image is at the same face scale */
  faceScale: number;
};

export const team: Member[] = [
  {
    id: "sarah",
    name: "Sarah Hewitt",
    role: "editor in chief.",
    expertise: ["admin", "inquiries"],
    degree: ["Professor of Biology", "PhD in Neuroscience"],
    bio:
      "I'm a Biology professor with a PhD in Neuroscience, and an adventure scientist who explores the world through photography, writing and art. I created Science Sphere in 2025 to show there's more to science writing than lab reports and journal articles, and to give MRU's secret artists, poets and writers a place in science communication.",
    fact: "[Sarah's interesting fact]",
    idNumber: "104729",
    serial: "SS7K2Q9XH4M1B",
    photo: "/team/sarah.webp",
    cardPhoto: "/team/sarah-card.webp",
    side: "left",
    faceAspect: 0.901,
    faceScale: 0.828,
  },
  {
    id: "hadi",
    name: "Hadi Jafry",
    role: "editor. writer. socials.",
    expertise: ["physics", "geology", "geography"],
    degree: ["BSc in Interdisciplinary Science"],
    bio:
      "I'm doing a BSc in Interdisciplinary Science with concentrations in physics and geography, and I work at TELUS Spark.",
    fact: "[Hadi's interesting fact]",
    idNumber: "238516",
    serial: "SS4F8R2LW9C3D",
    photo: "/team/hadi.webp",
    cardPhoto: "/team/hadi-card.webp",
    side: "right",
    faceAspect: 0.919,
    faceScale: 0.96,
  },
  {
    id: "liam",
    name: "Liam Rockliffe",
    role: "editor. writer. designer.",
    expertise: ["chemistry", "biology", "environmental sci."],
    degree: ["BSc in Chemistry"],
    bio:
      "I'm doing a BSc in Chemistry with a concentration in analytical biochemistry and a minor in communications. I've worked at The Reflector.",
    fact: "[Liam's interesting fact]",
    idNumber: "371094",
    serial: "SS9P1T6ZV2N8K",
    photo: "/team/liam.webp",
    cardPhoto: "/team/liam-card.webp",
    side: "left",
    faceAspect: 1.081,
    faceScale: 0.977,
  },
  {
    id: "qanita",
    name: "Qanita Farrukh",
    role: "editor. writer. designer.",
    expertise: ["computing", "math", "data sci."],
    degree: ["BSc in Computer Science"],
    bio:
      "I'm doing a BSc in Computer Science with a cognate in biology, and I've worked at Etherae Magazine.",
    fact: "[Qanita's interesting fact]",
    idNumber: "462803",
    serial: "SS3H7M5QJ1R6X",
    photo: "/team/qanita.webp",
    cardPhoto: "/team/qanita-card.webp",
    side: "right",
    faceAspect: 1.092,
    faceScale: 1.0,
  },
];
