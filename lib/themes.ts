// The header takes on the colours of the page you're on.
// bg = the bar, fg = its text, accent = the [brackets] and highlights.

export type Theme = { id: string; name: string; bg: string; fg: string; accent: string };

export const themes: Record<string, Theme> = {
  ink: { id: "ink", name: "Default", bg: "#0B0C0E", fg: "#EBE8DF", accent: "#EBE8DF" },
  space: { id: "space", name: "Space", bg: "#0D0630", fg: "#E6F9AF", accent: "#CAAC4B" },
  carousel: { id: "carousel", name: "Carousel", bg: "#210100", fg: "#FECE79", accent: "#E6A341" },
  sunset: { id: "sunset", name: "Sunset", bg: "#C93638", fg: "#F6FFEA", accent: "#FFDE96" },
  melon: { id: "melon", name: "Melon", bg: "#788417", fg: "#F6F1BC", accent: "#FDCB7B" },
};

/** Which theme each part of the site uses. */
export function themeFor(pathname: string): Theme {
  if (pathname === "/" || pathname.startsWith("/lab")) return themes.space;
  if (pathname.startsWith("/issues")) return themes.melon;
  if (pathname.startsWith("/team") || pathname.startsWith("/contact")) return themes.sunset;
  if (pathname.startsWith("/pitch")) return themes.carousel;
  return themes.ink;
}
