// Everything the Pitch a Story page needs: the kinds of story, the subjects
// (and which editor looks after each one), formats, and the guide notes beside the form.
// Wording comes from the Science Sphere Story Guide and "Writing A Science Sphere Magazine Article".

export const MAIN_EMAIL = "sciencesphere@mtroyal.ca";
/** Where every pitch is sent: only the magazine inbox (editors pick them up from there). */
export const PITCH_TO = [MAIN_EMAIL];
export const MAX_FILE_MB = 50;

export type StoryType = {
  id: string;
  name: string;
  description: string;
  length: string;
  /** A past piece of this kind, opened in the reader at its page. */
  example?: { title: string; issueId: string; page: number };
};

export const storyTypes: StoryType[] = [
  {
    id: "experience",
    name: "Your Experience",
    description:
      "Any part of your experience as an MRU science student. Working on a research project? Tell us about the process. Heading for professional school? Your journey could make a great story.",
    length: "about 500 words",
    example: { title: "From Genes to Growth", issueId: "3", page: 7 },
  },
  {
    id: "news",
    name: "In the News",
    description: "A recent science discovery or news story, from any field of science.",
    length: "about 500 words",
    example: { title: "In the News", issueId: "3", page: 5 },
  },
  {
    id: "feature",
    name: "Feature Article",
    description:
      "A longer, in-depth look at a science topic you love. Past features covered astrophotography, MRU's work to save native bees, and the flaws in research publishing.",
    length: "about 1000 words",
    example: { title: "Publish, Perish, Profit.", issueId: "3", page: 10 },
  },
  {
    id: "creative",
    name: "Creative Project",
    description: "Any creative piece about science: drawings, paintings, poems, collages, photography, zines, sculptures and more.",
    length: "any form",
    example: { title: "Inside cover art", issueId: "3", page: 2 },
  },
  {
    id: "lesson",
    name: "Mini Science Lesson",
    description: "Teach your peers a topic from a science or math course you've taken.",
    length: "250 to 500 words",
    example: { title: "Reading Scientific Journal Articles", issueId: "3", page: 22 },
  },
  {
    id: "idea",
    name: "Another Idea",
    description:
      "Science Sphere is an online multimedia magazine as well as a print one, so audio and video stories are welcome too. Don't limit your ideas.",
    length: "tell us",
  },
];

/** The editors and what they look after (from the PRD's team intros). */
export const editors = {
  sarah: { name: "Sarah Hewitt", role: "Editor in Chief" },
  hadi: { name: "Hadi Jafri", role: "Editor" },
  liam: { name: "Liam Rockliffe", role: "Editor" },
  qanita: { name: "Qanita Farrukh", role: "Editor" },
} as const;

export type EditorId = keyof typeof editors;

/** Subject areas on the form, and the editor who looks after each one (for reference; every pitch is sent to PITCH_TO only). */
export const subjects: { id: string; label: string; editor: EditorId }[] = [
  { id: "biology", label: "Biology", editor: "liam" },
  { id: "chemistry", label: "Chemistry", editor: "liam" },
  { id: "environmental", label: "Environmental science", editor: "liam" },
  { id: "physics", label: "Physics", editor: "hadi" },
  { id: "geology", label: "Geology", editor: "hadi" },
  { id: "geography", label: "Geography", editor: "hadi" },
  { id: "computing", label: "Computing", editor: "qanita" },
  { id: "math", label: "Math", editor: "qanita" },
  { id: "data", label: "Data science", editor: "qanita" },
  { id: "other", label: "Something else", editor: "sarah" },
];

export const formats = ["Written", "Visual", "Audio", "Video"] as const;

export const years = ["1st year", "2nd year", "3rd year", "4th year", "5th year or more", "Graduate student", "Alumni", "Not a student"];

export type Pitch = {
  name: string;
  email: string;
  program: string;
  year: string;
  type: string;
  /** what kind of idea, when the type is "Another Idea" */
  typeOther: string;
  subject: string;
  /** which subject, when it's "Something else" */
  subjectOther: string;
  formats: string[];
  angle: string;
  why: string;
  files: File[];
};
