import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // the look and feel board and the prototypes are only for us (see lib/workshop.ts)
    rules: { userAgent: "*", allow: "/", disallow: ["/board", "/lab"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
