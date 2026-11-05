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
  /** colour head and shoulders, for the team page (same scale as the ID card photo) */
  photo: string;
  /** colour head and shoulders, for the ID card */
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
      "Neuroscientist, Biology professor and self-described adventure scientist, usually found somewhere wild with a camera and a sketchbook. I started Science Sphere in 2025 because science deserves better stories than lab reports.",
    fact: "[Sarah's interesting fact]",
    idNumber: "104729",
    serial: "SS7K2Q9XH4M1B",
    photo: "/team/sarah-bust.webp",
    cardPhoto: "/team/sarah-idcard.webp",
    side: "left",
    faceAspect: 0.898,
    faceScale: 0.828,
  },
  {
    id: "hadi",
    name: "Hadi Jafry",
    role: "editor. writer. socials.",
    expertise: ["physics", "geology", "geography"],
    degree: ["BSc in Interdisciplinary Science"],
    bio:
      "Physics by day, geography by every other day. When I'm not studying how the Earth moves, I'm at TELUS Spark helping visitors fall in love with science.",
    fact: "[Hadi's interesting fact]",
    idNumber: "238516",
    serial: "SS4F8R2LW9C3D",
    photo: "/team/hadi-bust.webp",
    cardPhoto: "/team/hadi-idcard.webp",
    side: "right",
    faceAspect: 0.896,
    faceScale: 0.96,
  },
  {
    id: "liam",
    name: "Liam Rockliffe",
    role: "editor. writer. designer.",
    expertise: ["chemistry", "biology", "environmental sci."],
    degree: ["BSc in Chemistry"],
    bio:
      "I pull molecules apart for a living (or at least for a degree in analytical biochemistry), then put the story back together with a minor in communications. Formerly of The Reflector.",
    fact: "[Liam's interesting fact]",
    idNumber: "371094",
    serial: "SS9P1T6ZV2N8K",
    photo: "/team/liam-bust.webp",
    cardPhoto: "/team/liam-idcard.webp",
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
      "I write code by day and stories by night, with a biology cognate to keep things interesting. Before Science Sphere, I worked at Etherae Magazine.",
    fact: "[Qanita's interesting fact]",
    idNumber: "462803",
    serial: "SS3H7M5QJ1R6X",
    photo: "/team/qanita-bust.webp",
    cardPhoto: "/team/qanita-idcard.webp",
    side: "right",
    faceAspect: 1.092,
    faceScale: 1.0,
  },
];
