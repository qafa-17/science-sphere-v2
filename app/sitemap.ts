import type { MetadataRoute } from "next";
import { issues } from "@/lib/issues";
import { SITE_URL, publicPaths } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = publicPaths.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.8,
  }));
  const issuePages = issues
    .filter((issue) => issue.pageCount > 0)
    .map((issue) => ({
      url: `${SITE_URL}/issues/${issue.id}`,
      changeFrequency: "yearly" as const,
      priority: 0.7,
      images: issue.cover ? [`${SITE_URL}${issue.cover}`] : undefined,
    }));
  return [...pages, ...issuePages];
}
