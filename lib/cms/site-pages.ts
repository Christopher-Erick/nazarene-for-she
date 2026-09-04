export const SITE_PAGES = [
  {
    slug: "about",
    path: "/about",
    label: "Why We Exist",
    kicker: "Why we exist",
    title: "She is not a problem to be solved.",
    excerpt:
      "She is a person with potential who deserves opportunity. This page is for visitors who want the deeper organisational picture. The story itself lives on the journey through our work.",
    content: "",
  },
  {
    slug: "get-involved",
    path: "/get-involved",
    label: "Get Involved",
    kicker: "Get involved",
    title: "There are many ways to walk with her. Pick the one that is yours.",
    excerpt:
      "Help remove a barrier between her and her future. Whether you give, teach, pray or partner, you are participating in a transformation system — not a one-time rescue.",
    content: "",
  },
  {
    slug: "partnership",
    path: "/partnership",
    label: "Partner With Us",
    kicker: "Partnership",
    title: "You are not simply funding a program.",
    excerpt:
      "You are helping build pathways to dignity, skills and independence.",
    content: "",
  },
  {
    slug: "terms",
    path: "/terms",
    label: "Terms",
    kicker: "Terms",
    title: "Use this site to understand the work — and to walk with it honestly.",
    excerpt: "These terms cover the public website and its forms.",
    content: `<h2>Content</h2><p>Unpublished payment details and placeholder stories are marked as such. Do not treat placeholders as official organisational commitments. Mission and vision on this site follow the January 2021 constitution.</p><h2>Giving</h2><p>Donations should be made only through official details published by the organisation. If a field still reads as a placeholder, wait for confirmation before sending funds.</p><h2>The Atelier</h2><p>Shop orders are placed on this site at the prices shown. Pay only through the official M-Pesa, bank or M-Changa details published at checkout, using your order reference. Atmosphere photographs may show the workshop rather than a specific finished piece.</p><h2>Stories</h2><p>Photographs used as atmosphere are not portraits of named beneficiaries. Published personal stories will appear only with consent.</p>`,
  },
] as const;

export type SitePageSlug = (typeof SITE_PAGES)[number]["slug"];

export function isSitePageSlug(value: string): value is SitePageSlug {
  return SITE_PAGES.some((page) => page.slug === value);
}

export function sitePageBySlug(slug: string) {
  return SITE_PAGES.find((page) => page.slug === slug) ?? null;
}

export function assertSitePageSlug(slug: string, previousSlug?: string) {
  if (!isSitePageSlug(slug)) {
    throw new Error("Only the public site pages can be stored: about, get-involved, partnership, and terms.");
  }
  if (previousSlug && previousSlug !== slug) {
    throw new Error("Site page slugs cannot be renamed.");
  }
}

export const WORKSHOP_STILLS = ["fabric", "atelier", "thread"] as const;
export type WorkshopStill = (typeof WORKSHOP_STILLS)[number];

function clip(value: unknown, fallback: string, max: number) {
  const text = typeof value === "string" ? value : fallback;
  return text.slice(0, max);
}

export function atelierPayload(input: Record<string, unknown>) {
  const still = WORKSHOP_STILLS.includes(String(input.still) as WorkshopStill)
    ? (String(input.still) as WorkshopStill)
    : "atelier";
  const sortRaw = Number(input.sortOrder);
  return {
    eyebrow: clip(input.eyebrow, "From the workshop", 80),
    verb: clip(input.verb, "", 40),
    lure: clip(input.lure, "", 400),
    sizing: input.sizing === "one" ? "one" : "body",
    still,
    sortOrder: Number.isFinite(sortRaw) ? Math.max(0, Math.min(999, Math.round(sortRaw))) : 0,
  };
}
