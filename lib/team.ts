// The editors, for Meet the Team and their ID cards.
// Bios, fun facts and degrees in [brackets] are placeholders until each person sends theirs.

export type Member = {
  id: string;
  name: string;
  /** how the role reads on the team page, e.g. "editor. writer. socials." */
  role: string;
  /** what they look after */
  expertise: string[];
  /** e.g. "BSc in Computer Science" */
  degree: string;
  bio: string;
  fact: string;
  /** a made-up 6-digit ID number for the card */
  idNumber: string;
  /** a made-up 13-character serial for the back of the card */
  serial: string;
  /** black and white head cut-out, in public/team/ */
  photo: string;
  /** which side of the team page their face sits on */
  side: "left" | "right";
};

export const team: Member[] = [
  {
    id: "sarah",
    name: "Sarah Hewitt",
    role: "editor in chief.",
    expertise: ["admin", "inquiries"],
    degree: "[Degree] in [Subject]",
    bio: "[A few lines from Sarah about herself]",
    fact: "[Sarah's interesting fact]",
    idNumber: "104729",
    serial: "SS7K2Q9XH4M1B",
    photo: "/team/sarah.webp",
    side: "left",
  },
  {
    id: "hadi",
    name: "Hadi Jafry",
    role: "editor. writer. socials.",
    expertise: ["physics", "geology", "geography"],
    degree: "[Degree] in [Subject]",
    bio: "[A few lines from Hadi about himself]",
    fact: "[Hadi's interesting fact]",
    idNumber: "238516",
    serial: "SS4F8R2LW9C3D",
    photo: "/team/hadi.webp",
    side: "right",
  },
  {
    id: "liam",
    name: "Liam Rockliffe",
    role: "editor. writer. designer.",
    expertise: ["chemistry", "biology", "environmental sci."],
    degree: "[Degree] in [Subject]",
    bio: "[A few lines from Liam about himself]",
    fact: "[Liam's interesting fact]",
    idNumber: "371094",
    serial: "SS9P1T6ZV2N8K",
    photo: "/team/liam.webp",
    side: "left",
  },
  {
    id: "qanita",
    name: "Qanita Farrukh",
    role: "editor. writer. designer.",
    expertise: ["computing", "math", "data sci."],
    degree: "BSc in Computer Science",
    bio: "[A few lines from Qanita about herself]",
    fact: "[Qanita's interesting fact]",
    idNumber: "462803",
    serial: "SS3H7M5QJ1R6X",
    photo: "/team/qanita.webp",
    side: "right",
  },
];
