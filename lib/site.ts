// The site's own web address, for share previews, the sitemap and robots.txt.
//
// Set NEXT_PUBLIC_SITE_URL on Vercel once the site has its real address
// (e.g. https://sciencesphere.ca). Until then, Vercel's own production address
// is used, and on your computer it's http://localhost:3000.

function siteUrl() {
  const set = process.env.NEXT_PUBLIC_SITE_URL;
  if (set) return set.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const SITE_URL = siteUrl();
export const SITE_NAME = "Science Sphere";
export const SITE_TAGLINE = "The MRU Science Experience";
export const SITE_DESCRIPTION =
  "Science Sphere, the MRU science experience: Mount Royal University's student science magazine. Read every issue, pitch a story, meet the team.";

/** The public pages, for the sitemap. The look and feel board and the lab prototypes are left out on purpose. */
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
      images: [{ url: image ?? "/opengraph-image.png", width: 1200, height: 630, alt: `${title} · ${SITE_NAME}` }],
    },
  };
}
