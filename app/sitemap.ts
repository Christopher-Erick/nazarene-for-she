import {
  publishedEvents,
  publishedGarments,
  publishedProducts,
  publishedPrograms,
  publishedStories,
} from "@/lib/cms/public-content";
import { productHref } from "@/lib/shop/catalog";
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
  const [programs, stories, events, garments, products] = await Promise.all([
    publishedPrograms(),
    publishedStories(),
    publishedEvents(),
    publishedGarments(),
    publishedProducts(),
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
    ...products.map((product) => ({
      url: `${site.url}${productHref(product)}`,
      lastModified: now,
    })),
    // Placeholder story frames are noindex, so they stay out of the sitemap too.
    ...stories
      .filter((story) => story.status !== "placeholder")
      .map((story) => ({
      url: `${site.url}/stories/${story.slug}`,
      lastModified: now,
    })),
    ...events.map((event) => ({
      url: `${site.url}/events/${event.slug}`,
      lastModified: now,
    })),
  ];
}

