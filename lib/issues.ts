// All the magazine's issues live here for now.
// Later this moves into Supabase so editors can add issues from the dashboard,
// but the shape of each issue stays the same.

import { issue1Hotspots, issue2Hotspots, issue3Hotspots } from "./issueLinks";

export type Article = {
  title: string;
  by: string;
  /** A short teaser that makes people want to read it. */
  hook: string;
  /** The page the article starts on, so clicking it opens the reader right there. */
  page?: number;
};

/**
 * Where something sits on a page, in percent of the page's width and height,
 * measured from the top-left corner. { x: 10, y: 20, w: 30, h: 5 } means:
 * starts 10% from the left, 20% from the top, 30% wide, 5% tall.
 * Percent means it stays in the right spot at any screen size.
 */
export type Box = { x: number; y: number; w: number; h: number };

/**
 * Interactive things layered on top of a page. They're real buttons, links,
 * videos and audio sitting on the page, so they work right inside the magazine.
 */
export type Hotspot =
  /** jump to another page of the same issue (e.g. the contents page) */
  | { kind: "page"; page: number; to: number; box: Box; label: string }
  /** a genuine link to somewhere else (another part of the site, or a website) */
  | { kind: "link"; page: number; href: string; box: Box; label: string }
  /** a video that plays right on the page, inside its box */
  | { kind: "video"; page: number; src: string; poster?: string; box: Box; label: string }
  /** a soundbite: a small play button on the page */
  | {
      kind: "audio";
      page: number;
      src: string;
      box: Box;
      label: string;
      /** play from the magazine's own "listen here" graphic (an invisible button over it) instead of a round speaker button */
      overlay?: boolean;
    };

/** The colours an issue can have. Each one is defined in app/globals.css. */
export const issueColours = {
  lime: { accent: "var(--lime)", light: "var(--green-light)" },
  green: { accent: "var(--green)", light: "var(--green-light)" },
  sky: { accent: "var(--sky)", light: "var(--sky-light)" },
  black: { accent: "var(--ink)", light: "#dfe1e4" },
  coral: { accent: "var(--coral)", light: "var(--coral-light)" },
  sun: { accent: "var(--sun)", light: "var(--sun-light)" },
  plum: { accent: "var(--plum)", light: "var(--plum-light)" },
  pink: { accent: "var(--pink)", light: "var(--pink-light)" },
} as const;

export type IssueColour = keyof typeof issueColours;

export type Issue = {
  /** Used in the web address: /issues/3 */
  id: string;
  number: number;
  season: string;
  /** The issue's own colour, matching its cover. */
  colour: IssueColour;
  /** Its folder tab on the Issues page: a darker version of the cover's colour. */
  tab: string;
  /** Path to the cover image in /public, or undefined if we don't have it yet. */
  cover?: string;
  summary: string;
  /** Featured articles. Only the first 3 are shown on the Issues page. */
  articles: Article[];
  /** How many pages the reader has. 0 means the pages haven't been uploaded yet. */
  pageCount: number;
  /** Links, page jumps, videos and soundbites on the pages. */
  hotspots?: Hotspot[];
};

export const issues: Issue[] = [
  {
    id: "3",
    number: 3,
    season: "Fall 2026",
    colour: "lime",
    tab: "#3E4D0E",
    cover: "/issues/3/cover.webp",
    summary:
      "This issue pulls back the curtain on how science really works: the broken incentives behind publishing, a student's first research project, the race for new antibiotics, and a crash course in reading papers. Plus a viral herb under the microscope, a kids' anatomy book reimagined, an alumni chat, and mental health resources for when uni gets heavy.",
    articles: [
      {
        title: "Publish, Perish, Profit.",
        by: "Raya Cabot",
        hook: "Why is modern science set up to fail? Follow the metrics and the incentives.",
        page: 10,
      },
      {
        title: "The Future of the Antibiotic Crisis",
        by: "Rhys Gunderson and Jyrick Nano",
        hook: "Antibiotics are quietly losing. Could bacteria's own weapons, plus some AI, be the next defence?",
        page: 16,
      },
      {
        title: "Ancient Herb, TikTok Hype",
        by: "Abdulwahid Chebbani",
        hook: "Ashwagandha is all over TikTok. What does the research actually say?",
        page: 25,
      },
    ],
    pageCount: 36,
    hotspots: issue3Hotspots,
  },
  {
    id: "2",
    number: 2,
    season: "Winter 2026",
    colour: "green",
    tab: "#4C473E",
    cover: "/issues/2/cover.webp",
    summary:
      "A green issue, inside and out: native plants bringing bees back to campus, the greenhouse hidden behind a blue door, and why film photography still wins hearts in a digital world. Plus the woman who mapped penicillin, insulin and vitamin B12, how your gut talks to your brain, an alumni chat with Jonah Lamoureux, and Little Science Sphere, a section for the young scientists in our lives.",
    articles: [
      {
        title: "From Pixels to Grain",
        by: "Renz Manipon",
        hook: "Digital cameras are sharper, faster and cheaper. So why are people falling back in love with film?",
        page: 13,
      },
      {
        title: "MRU's Secret Garden",
        by: "Regan Todd",
        hook: "Life behind the blue door: a look inside the campus greenhouse most students walk right past.",
        page: 19,
      },
      {
        title: "The Architect of Atoms",
        by: "Henna Mathouda",
        hook: "Dorothy Crowfoot Hodgkin mapped penicillin, vitamin B12 and insulin, one atom at a time.",
        page: 24,
      },
    ],
    pageCount: 50,
    hotspots: [
      ...issue2Hotspots,
      {
        kind: "video",
        page: 23,
        src: "/issues/media/greenhouse-tour.mp4",
        poster: "/issues/media/greenhouse-tour.jpg",
        label: "A sneak peek inside the greenhouse",
        box: { x: 7, y: 8, w: 86, h: 37.4 },
      },
      {
        kind: "video",
        page: 30,
        src: "/issues/media/lab-skills-pipetting.mp4",
        poster: "/issues/media/lab-skills-pipetting.jpg",
        label: "Lab Skills: pipetting with precision, with Dr. Nausheen Sadiq",
        box: { x: 7, y: 7.5, w: 86, h: 37.4 },
      },
    ],
  },
  {
    id: "1",
    number: 1,
    season: "Fall 2025",
    colour: "sky",
    tab: "#2E5574",
    cover: "/issues/1/cover.webp",
    summary:
      "Our very first issue follows students into the field and the lab: from the Canadian High Arctic to a German forest, from posture research at high altitude to a summer spent modelling viruses. Plus a device that listens to blood, why drawing helps you learn, advice from fourth-year students, useful campus resources, and an alumni chat with Caleb Marx.",
    articles: [
      {
        title: "How Diverse Landscapes Shaped an Aspiring Scientist",
        by: "Ashley Lawson",
        hook: "From insects in the High Arctic to invasive evergreens in Germany's Black Forest: one student's path through fieldwork.",
        page: 8,
      },
      {
        title: "Up in the Air",
        by: "Sama Ghods",
        hook: "What happens to your balance at high altitude? A first research project, from cold email to the lab.",
        page: 25,
      },
      {
        title: "Listening to Blood",
        by: "Henna Mathouda",
        hook: "A device that hears malaria parasites through the skin, without taking a drop of blood.",
        page: 22,
      },
    ],
    pageCount: 36,
    hotspots: [
      ...issue1Hotspots,
      {
        kind: "audio",
        page: 21,
        src: "/issues/media/majd-daqqa-interview.mp3",
        label: "Majd Daqqa on the FST IDEA Committee",
        box: { x: 54.5, y: 30.5, w: 18, h: 7.5 },
        overlay: true,
      },
    ],
  },
];

export function getIssue(id: string): Issue | undefined {
  return issues.find((issue) => issue.id === id);
}

/** Web addresses of every page image, in order: /issues/3/page-01.webp ... */
export function pageImages(issue: Issue): string[] {
  return Array.from(
    { length: issue.pageCount },
    (_, i) => `/issues/${issue.id}/page-${String(i + 1).padStart(2, "0")}.webp`,
  );
}
