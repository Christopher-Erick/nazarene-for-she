import { programs } from "@/lib/data/programs";
import { garments } from "@/lib/data/shop";
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
    "/shop",
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
    ...garments.map((garment) => ({
      url: `${site.url}/shop/${garment.slug}`,
      lastModified: now,
    })),
    ...stories.map((story) => ({
      url: `${site.url}/stories/${story.slug}`,
      lastModified: now,
    })),
  ];
}
