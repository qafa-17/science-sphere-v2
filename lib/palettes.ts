// The colour palettes. Each page of the site uses one of them.

export type Swatch = { name: string; hex: string };
export type Palette = { id: string; name: string; swatches: Swatch[] };

export const palettes: Record<string, Palette> = {
  space: {
    id: "space",
    name: "Space",
    swatches: [
      { name: "Lime Green", hex: "#E6F9AF" },
      { name: "Metallic Gold", hex: "#CAAC4B" },
      { name: "Muted Teal", hex: "#8BBEB2" },
      { name: "Deep Space Blue", hex: "#18314F" },
      { name: "Dark Amethyst", hex: "#0D0630" },
    ],
  },
  logo: {
    id: "logo",
    name: "Logo",
    swatches: [
      { name: "Sphere Navy", hex: "#1B4079" },
      { name: "Orchid", hex: "#E58EF6" },
      { name: "Signal Pink", hex: "#FF6B9A" },
      { name: "Mist", hex: "#DCE3EE" },
      { name: "Night", hex: "#0B1A33" },
    ],
  },
  sunset: {
    id: "sunset",
    name: "Sunset",
    swatches: [
      { name: "Honeydew", hex: "#F6FFEA" },
      { name: "Soft Peach", hex: "#FFDE96" },
      { name: "Coral Glow", hex: "#FA855A" },
      { name: "Tomato Jam", hex: "#C93638" },
      { name: "Sky Blue", hex: "#62C4DA" },
    ],
  },
  melon: {
    id: "melon",
    name: "Melon",
    swatches: [
      { name: "Exocarp", hex: "#788417" },
      { name: "Unripe", hex: "#AAB026" },
      { name: "Mystic Melon", hex: "#F6F1BC" },
      { name: "Cantaloupe", hex: "#FDCB7B" },
      { name: "Kumquat", hex: "#EEA64B" },
      { name: "Orange Zest", hex: "#D9641F" },
    ],
  },
};

/** Which palette each page uses. */
export const pagePalettes: { page: string; path: string; palette: string; why: string }[] = [
  { page: "Landing", path: "/", palette: "space", why: "night sky, high-tech" },
  { page: "Issues", path: "/issues", palette: "logo", why: "where the magazine lives" },
  { page: "Meet the Team", path: "/team", palette: "sunset", why: "honeydew ID cards, tomato-red dots" },
  { page: "Pitch a Story", path: "/pitch", palette: "melon", why: "fresh ideas" },
  { page: "Contact", path: "/contact", palette: "sunset", why: "warm, with a red beating heart" },
];

export function rgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

/** Dark text on light swatches, light text on dark ones. */
export function textOn(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const l = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return l > 150 ? "#0B0C0E" : "#FFFFFF";
}
