// The site's own web address, for share previews, the sitemap and robots.txt.
export const SITE_URL = "https://sciencesphere.ca";
export const SITE_NAME = "Science Sphere";
/** Describes app/opengraph-image.png for people who can't see it. */
export const OG_ALT = "The round Science Sphere logo: Science Sphere, The MRU Science Experience, over a sphere of joined dots.";
export const SITE_TAGLINE = "The MRU Science Experience";
export const SITE_DESCRIPTION =
  "Science Sphere, the MRU science experience: Mount Royal University's student science magazine. Read every issue, pitch a story, meet the team.";

/** The pages listed in the sitemap (the issues are added from lib/issues.ts). */
export const publicPaths = ["/", "/issues", "/pitch", "/team", "/team/ids", "/contact"];

/**
 * A page's title and description, plus the same for its share preview.
 * (A page that sets its own share text replaces the layout's whole openGraph
 * block, so the site name and type are repeated here.)
 */
export function pageMeta({ title, description, path, image }: { title: string; description: string; path: string; image?: string }) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website" as const,
      siteName: SITE_NAME,
      locale: "en_CA",
      url: path,
      title: `${title} · ${SITE_NAME}`,
      description,
      // without an image of its own, the site's one (app/opengraph-image.png)
      images: [{ url: image ?? "/opengraph-image.png", width: 1200, height: 630, alt: OG_ALT }],
    },
  };
}
