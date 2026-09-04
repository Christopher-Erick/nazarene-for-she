import { publishedEvents, publishedGarments, publishedPrograms, publishedStories } from "@/lib/cms/public-content";
import { site } from "@/lib/data/site";

export default async function sitemap() {
  const staticRoutes = [
    "",
    "/about",
    "/programs",
    "/impact",
    "/events",
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
  const [programs, stories, events, garments] = await Promise.all([
    publishedPrograms(),
    publishedStories(),
    publishedEvents(),
    publishedGarments(),
  ]);

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
    ...events.map((event) => ({
      url: `${site.url}/events/${event.slug}`,
      lastModified: now,
    })),
  ];
}

