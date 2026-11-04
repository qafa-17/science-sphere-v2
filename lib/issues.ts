// All the magazine's issues live here for now.
// Later this moves into Supabase so editors can add issues from the dashboard,
// but the shape of each issue stays the same.

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
  | { kind: "audio"; page: number; src: string; box: Box; label: string };

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

// Issue 3's contents page (page 2): each line jumps to its article.
const contentsBox = (top: number, bottom: number): Box => ({ x: 37, y: top - 1, w: 56, h: bottom - top + 2 });
const issue3Contents: Hotspot[] = [
  { to: 3, label: "Letter From the Editors", box: contentsBox(13.7, 15.3) },
  { to: 4, label: "Join Science Sphere!", box: contentsBox(18.5, 20.1) },
  { to: 5, label: "In The News", box: contentsBox(23.5, 25.0) },
  { to: 7, label: "From Genes to Growth", box: contentsBox(29.0, 30.4) },
  { to: 10, label: "Publish, Perish, Profit", box: contentsBox(34.2, 36.1) },
  { to: 15, label: "Know-It-All", box: contentsBox(38.9, 40.5) },
  { to: 16, label: "The Future of the Antibiotic Crisis", box: contentsBox(43.6, 45.5) },
  { to: 20, label: "Alumni Corner with Holly Kinas", box: contentsBox(48.4, 50.1) },
  { to: 22, label: "Reading Scientific Journal Articles", box: contentsBox(53.6, 55.6) },
  { to: 24, label: "Ancient Herb, TikTok Hype", box: contentsBox(58.2, 60.2) },
  { to: 29, label: "Student Recovery on Campus and Mental Health Resources", box: contentsBox(63.3, 67.3) },
  { to: 32, label: "Redesigning Health Literacy for Kids", box: contentsBox(70.5, 72.6) },
  { to: 35, label: "References", box: contentsBox(76.3, 78.6) },
].map((entry) => ({ kind: "page" as const, page: 2, ...entry }));

export const issues: Issue[] = [
  {
    id: "3",
    number: 3,
    season: "Fall 2026",
    colour: "lime",
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
        page: 24,
      },
    ],
    pageCount: 36,
    hotspots: [
      ...issue3Contents,
      // the QR codes on "Join Science Sphere!" become tappable on the website
      { kind: "link", page: 4, href: "/pitch", label: "Get involved: pitch a story", box: { x: 78.5, y: 31.5, w: 17.5, h: 14 } },
      { kind: "link", page: 4, href: "/issues", label: "Read our other issues", box: { x: 78.5, y: 57.2, w: 17.5, h: 14 } },
    ],
  },
  {
    id: "2",
    number: 2,
    season: "Winter 2026",
    colour: "plum", // TODO: Issue 2's real colour
    summary: "[Summary of Issue #2]",
    articles: [],
    pageCount: 0,
  },
  {
    id: "1",
    number: 1,
    season: "Fall 2025",
    colour: "sky",
    summary: "[Summary of Issue #1]",
    articles: [],
    pageCount: 0,
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
