import { getDb, queryAll, queryFirst } from "@/lib/cms/db";
import { getPublishedBySlug, listPublished, parsePayload, type ContentRow } from "@/lib/cms/content";
import { getSetting } from "@/lib/cms/settings";
import { aboutContent } from "@/lib/data/about";
import { donationIntro, donationMethods, type DonationMethod } from "@/lib/data/donation";
import { events as staticEvents, type NfsEvent } from "@/lib/data/events";
import { impactMetrics, type ImpactMetric } from "@/lib/data/impact";
import { programs as staticPrograms, type ProgramWithStories } from "@/lib/data/programs";
import { stories as staticStories, type Story } from "@/lib/data/stories";
import { garments as staticGarments, type Garment } from "@/lib/data/shop";
import { cache } from "react";
import { SITE_PAGES, type SitePageSlug, sitePageBySlug } from "@/lib/cms/site-pages";
import { categoryFromGarment, sortCategories, sortProducts, staticProducts } from "@/lib/shop/catalog";
import { listPublishedProducts, productFromRow } from "@/lib/shop/products";
import type { ShopCategory, ShopProduct } from "@/lib/shop/types";

function payloadString(payload: Record<string, unknown>, key: string, fallback = "") {
  const value = payload[key];
  return typeof value === "string" ? value : fallback;
}

export const publishedPrograms = cache(async function publishedPrograms(): Promise<ProgramWithStories[]> {
  const db = await getDb();
  if (!db) return staticPrograms;
  const rows = await listPublished(db, "programs");
  if (!rows.length) return staticPrograms;
  return rows.map(programFromRow);
});

export async function publishedProgram(slug: string) {
  const db = await getDb();
  if (db) {
    const row = await getPublishedBySlug(db, "programs", slug);
    if (row) return programFromRow(row);
  }
  return staticPrograms.find((item) => item.slug === slug) ?? null;
}

function programFromRow(row: ContentRow): ProgramWithStories {
  const payload = parsePayload(row.payload);
  return {
    slug: row.slug,
    name: row.title,
    eyebrow: payloadString(payload, "eyebrow", "Programme"),
    summary: row.excerpt || payloadString(payload, "summary"),
    explanation: row.content || payloadString(payload, "explanation"),
    impact: payloadString(payload, "impact"),
    donationCategory: payloadString(payload, "donationCategory", "General Support"),
    cta: {
      label: payloadString(payload, "ctaLabel", "Support this work"),
      href: payloadString(payload, "ctaHref", "/donate"),
    },
    visual: row.featured_image || payloadString(payload, "visual", "/images/atmosphere-community.webp"),
    relatedStorySlugs: Array.isArray(payload.relatedStorySlugs)
      ? payload.relatedStorySlugs.filter((item): item is string => typeof item === "string")
      : [],
  };
}

export const publishedEvents = cache(async function publishedEvents(): Promise<NfsEvent[]> {
  const db = await getDb();
  if (!db) return staticEvents;
  const rows = await listPublished(db, "events");
  if (!rows.length) return staticEvents;
  return rows.map(eventFromRow);
});

export async function publishedEvent(slug: string) {
  const db = await getDb();
  if (db) {
    const row = await getPublishedBySlug(db, "events", slug);
    if (row) return eventFromRow(row);
  }
  return staticEvents.find((item) => item.slug === slug) ?? null;
}

function eventFromRow(row: ContentRow): NfsEvent {
  const payload = parsePayload(row.payload);
  const type = payloadString(payload, "type", "outreach");
  return {
    slug: row.slug,
    title: row.title,
    summary: row.excerpt,
    description: row.content,
    type: ["distribution", "mentorship", "discipleship", "workshop", "outreach", "fundraiser"].includes(type)
      ? (type as NfsEvent["type"])
      : "outreach",
    startsAt: payloadString(payload, "startsAt", new Date(row.published_at ?? row.created_at).toISOString()),
    endsAt: payloadString(payload, "endsAt") || undefined,
    location: payloadString(payload, "location", "Congo, Kawangware"),
    locationDetail: payloadString(payload, "locationDetail") || undefined,
    visual: row.featured_image || "/images/atmosphere-community.webp",
    relatedProgramSlug: payloadString(payload, "relatedProgramSlug") || undefined,
    cta: payloadString(payload, "ctaHref")
      ? { label: payloadString(payload, "ctaLabel", "Support this event"), href: payloadString(payload, "ctaHref") }
      : undefined,
    featured: payload.featured === true,
  };
}

export const publishedStories = cache(async function publishedStories(): Promise<Story[]> {
  const db = await getDb();
  if (!db) return staticStories;
  const rows = await listPublished(db, "stories");
  if (!rows.length) return staticStories;
  return rows.map(storyFromRow);
});

export async function publishedStory(slug: string) {
  const db = await getDb();
  if (db) {
    const row = await getPublishedBySlug(db, "stories", slug);
    if (row) return storyFromRow(row);
  }
  return staticStories.find((item) => item.slug === slug) ?? null;
}

function storyFromRow(row: ContentRow): Story {
  const payload = parsePayload(row.payload);
  return {
    slug: row.slug,
    status: payloadString(payload, "storyStatus", "published") === "placeholder" ? "placeholder" : "published",
    firstName: payloadString(payload, "firstName", row.title),
    community: payloadString(payload, "community", ""),
    portrait: row.featured_image || "/images/atmosphere-classroom.webp",
    portraitAlt: payloadString(payload, "portraitAlt", row.title),
    challenge: payloadString(payload, "challenge", row.excerpt),
    experience: payloadString(payload, "experience", row.content),
    transformation: payloadString(payload, "transformation"),
    aspiration: payloadString(payload, "aspiration"),
    relatedProgramSlugs: Array.isArray(payload.relatedProgramSlugs)
      ? payload.relatedProgramSlugs.filter((item): item is string => typeof item === "string")
      : [],
  };
}

export async function publishedPages() {
  const db = await getDb();
  if (!db) return [];
  return listPublished(db, "pages");
}

export async function publishedPage(slug: string) {
  const db = await getDb();
  if (!db) return null;
  return getPublishedBySlug(db, "pages", slug);
}

export type PublicSitePage = {
  slug: SitePageSlug;
  path: string;
  label: string;
  kicker: string;
  title: string;
  excerpt: string;
  content: string;
  payload: Record<string, unknown>;
};

export const publishedSitePage = cache(async function publishedSitePage(slug: SitePageSlug): Promise<PublicSitePage> {
  const fallback = sitePageBySlug(slug) ?? SITE_PAGES[0];
  const db = await getDb();
  if (db) {
    const row = await getPublishedBySlug(db, "pages", slug);
    if (row) {
      const payload = parsePayload(row.payload);
      return {
        slug,
        path: fallback.path,
        label: fallback.label,
        kicker: payloadString(payload, "kicker", fallback.kicker),
        title: row.title || fallback.title,
        excerpt: row.excerpt || fallback.excerpt,
        content: row.content || fallback.content,
        payload,
      };
    }
  }
  return {
    slug: fallback.slug,
    path: fallback.path,
    label: fallback.label,
    kicker: fallback.kicker,
    title: fallback.title,
    excerpt: fallback.excerpt,
    content: fallback.content,
    payload: {},
  };
});

export const publishedGarments = cache(async function publishedGarments(): Promise<Garment[]> {
  const db = await getDb();
  if (!db) return staticGarments;
  const rows = await listPublished(db, "atelier");
  if (!rows.length) return staticGarments;
  return rows
    .map((row) => ({ row, payload: parsePayload(row.payload) }))
    .sort((a, b) => {
      const aOrder = Number(a.payload.sortOrder ?? 0);
      const bOrder = Number(b.payload.sortOrder ?? 0);
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.row.title.localeCompare(b.row.title);
    })
    .map(({ row }) => garmentFromRow(row));
});

export async function publishedGarment(slug: string) {
  const db = await getDb();
  if (db) {
    const row = await getPublishedBySlug(db, "atelier", slug);
    if (row) return garmentFromRow(row);
  }
  return staticGarments.find((item) => item.slug === slug) ?? null;
}

function categoryFromRow(row: ContentRow): ShopCategory {
  const garment = garmentFromRow(row);
  const payload = parsePayload(row.payload);
  const sortOrder = Number(payload.sortOrder ?? 0);
  return {
    ...categoryFromGarment(garment, row.id),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  };
}

export const publishedCategories = cache(async function publishedCategories(): Promise<ShopCategory[]> {
  const db = await getDb();
  if (db) {
    const rows = await listPublished(db, "atelier");
    if (rows.length) {
      return sortCategories(rows.map(categoryFromRow));
    }
  }
  return sortCategories(staticGarments.map((garment) => categoryFromGarment(garment)));
});

export async function publishedCategory(slug: string) {
  const db = await getDb();
  if (db) {
    const row = await getPublishedBySlug(db, "atelier", slug);
    if (row) return categoryFromRow(row);
  }
  const garment = staticGarments.find((item) => item.slug === slug);
  return garment ? categoryFromGarment(garment) : null;
}

export const publishedProducts = cache(async function publishedProducts(): Promise<ShopProduct[]> {
  const db = await getDb();
  if (!db) return sortProducts(staticProducts());
  try {
    const rows = await listPublishedProducts(db);
    return sortProducts(rows.map(productFromRow));
  } catch {
    return sortProducts(staticProducts());
  }
});

export async function publishedProduct(categorySlug: string, productSlug: string) {
  const products = await publishedProducts();
  return products.find((item) => item.categorySlug === categorySlug && item.slug === productSlug) ?? null;
}

function garmentFromRow(row: ContentRow): Garment {
  const payload = parsePayload(row.payload);
  const collection = payloadString(payload, "collection", "wear");
  const still = payloadString(payload, "still");
  return {
    slug: row.slug,
    collection: collection === "day" || collection === "carry" ? collection : "wear",
    name: row.title,
    eyebrow: payloadString(payload, "eyebrow", "From the workshop"),
    verb: payloadString(payload, "verb", "Sew"),
    summary: row.excerpt || payloadString(payload, "summary"),
    lure: payloadString(payload, "lure"),
    explanation: row.content || payloadString(payload, "explanation"),
    sizing: payload.sizing === "one" ? "one" : "body",
    still: still === "fabric" || still === "atelier" || still === "thread" ? still : undefined,
    visual: row.featured_image || undefined,
  };
}

export const publishedImpact = cache(async function publishedImpact(): Promise<ImpactMetric[]> {
  const db = await getDb();
  if (!db) return impactMetrics;
  const rows = await queryAll<{
    id: string;
    label: string;
    value: string;
    status: string;
    note: string;
  }>(db, "SELECT id, label, value, status, note FROM impact_statistics WHERE published = 1 ORDER BY sort_order ASC");
  if (!rows.length) return impactMetrics;
  return rows.map((row) => ({
    id: row.id,
    value: row.value,
    label: row.label,
    status: row.status === "verified" ? "verified" : "awaiting-verification",
    note: row.note || undefined,
  }));
});

export function girlsSupportedFromImpact(metrics: ImpactMetric[]) {
  const fallback = impactMetrics.find((item) => item.id === "girls-supported") ?? impactMetrics[0];
  const match =
    metrics.find((item) => item.id === "girls-supported") ??
    metrics.find((item) => /girl/i.test(item.label) && /\d/.test(item.value)) ??
    fallback;
  const value = Number(String(match?.value ?? "").replace(/[^\d]/g, "")) || 0;
  return {
    value,
    display: match?.value ?? "0",
    label: match?.label ?? "Girls currently supported",
    verified: match?.status === "verified",
  };
}

export const publishedOrganization = cache(async function publishedOrganization() {
  const stored = await getSetting<Record<string, unknown>>("organization", {});
  const text = (key: string, fallback: string) =>
    typeof stored[key] === "string" && String(stored[key]).trim() ? String(stored[key]) : fallback;

  return {
    ...aboutContent,
    mission: {
      ...aboutContent.mission,
      body: text("mission", aboutContent.mission.body),
    },
    vision: {
      ...aboutContent.vision,
      body: text("vision", aboutContent.vision.body),
    },
    whoWeAre: {
      ...aboutContent.whoWeAre,
      body: text("description", aboutContent.whoWeAre.body),
    },
    ourStory: {
      ...aboutContent.ourStory,
      body: text("ourStory", aboutContent.ourStory.body),
    },
    approach: {
      ...aboutContent.approach,
      body: text("approach", aboutContent.approach.body),
    },
    faith: {
      ...aboutContent.faith,
      body: text("faith", aboutContent.faith.body),
    },
    community: {
      ...aboutContent.community,
      body: text("community", aboutContent.community.body),
    },
    sustainability: {
      ...aboutContent.sustainability,
      body: text("sustainability", aboutContent.sustainability.body),
    },
    leadership: {
      ...aboutContent.leadership,
      body: text("leadership", aboutContent.leadership.body),
    },
    phone: text("phone", ""),
    whatsapp: String(stored.whatsapp ?? "").replace(/\D/g, ""),
  };
});

export async function publishedDonations() {
  const stored = await getSetting<{
    intro?: string;
    methods?: DonationMethod[];
    note?: string;
  }>("donations", {});
  return {
    intro: stored.intro || donationIntro,
    methods: Array.isArray(stored.methods) && stored.methods.length ? stored.methods : donationMethods,
    note: stored.note || "",
  };
}

export async function publishedPrivacy() {
  return getSetting<{ title: string; body: string }>("privacy_policy", {
    title: "Privacy",
    body: "",
  });
}

export async function settingValue<T>(key: string, fallback: T) {
  return getSetting(key, fallback);
}

export async function countPublished(type: "pages" | "programs" | "stories" | "events" | "atelier") {
  const db = await getDb();
  if (!db) return 0;
  const row = await queryFirst<{ n: number }>(
    db,
    "SELECT COUNT(*) AS n FROM content_items WHERE type = ? AND status = 'published' AND deleted_at IS NULL",
    type,
  );
  return row?.n ?? 0;
}
