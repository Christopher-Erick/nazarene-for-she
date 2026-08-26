import { programs } from "@/lib/data/programs";
import { site } from "@/lib/data/site";
import { stories } from "@/lib/data/stories";

export default function sitemap() {
  const staticRoutes = [
    "",
    "/about",
    "/programs",
    "/impact",
    "/stories",
    "/get-involved",
    "/donate",
    "/contact",
    "/partnership",
    "/privacy",
    "/terms",
  ];

  const now = new Date();

  return [
    ...staticRoutes.map((path) => ({
      url: `${site.url}${path}`,
      lastModified: now,
    })),
    ...programs.map((program) => ({
      url: `${site.url}/programs/${program.slug}`,
      lastModified: now,
    })),
    ...stories.map((story) => ({
      url: `${site.url}/stories/${story.slug}`,
      lastModified: now,
    })),
  ];
}
