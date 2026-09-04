import { involvementPaths } from "../data/donation.ts";
import { partnershipContent } from "../data/about.ts";

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function clip(value: unknown, fallback: string, max: number) {
  const text = typeof value === "string" && value.trim() ? value.trim() : fallback;
  return text.slice(0, max);
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

const EVENT_TYPES = ["distribution", "mentorship", "discipleship", "workshop", "outreach", "fundraiser"] as const;
type EventType = (typeof EVENT_TYPES)[number];

export function programPayload(input: Record<string, unknown>) {
  return {
    eyebrow: clip(input.eyebrow, "Programme", 40),
    impact: clip(input.impact, "", 400),
    donationCategory: clip(input.donationCategory, "General Support", 80),
    ctaLabel: clip(input.ctaLabel, "Support this work", 80),
    ctaHref: clip(input.ctaHref, "/donate", 200),
    relatedStorySlugs: stringList(input.relatedStorySlugs).slice(0, 12),
  };
}

export function storyPayload(input: Record<string, unknown>) {
  const ageRaw = Number(input.age);
  return {
    storyStatus: input.storyStatus === "placeholder" ? "placeholder" : "published",
    firstName: clip(input.firstName, "", 80),
    community: clip(input.community, "", 120),
    portraitAlt: clip(input.portraitAlt, "", 240),
    transformation: clip(input.transformation, "", 2000),
    aspiration: clip(input.aspiration, "", 2000),
    relatedProgramSlugs: stringList(input.relatedProgramSlugs).slice(0, 12),
    age: Number.isFinite(ageRaw) && ageRaw >= 1 && ageRaw <= 120 ? Math.round(ageRaw) : undefined,
  };
}

export function eventPayload(input: Record<string, unknown>) {
  const type = (EVENT_TYPES as readonly string[]).includes(String(input.type))
    ? (String(input.type) as EventType)
    : "outreach";
  return {
    type,
    startsAt: clip(input.startsAt, "", 40),
    endsAt: clip(input.endsAt, "", 40),
    location: clip(input.location, "Congo, Kawangware", 120),
    locationDetail: clip(input.locationDetail, "", 240),
    relatedProgramSlug: clip(input.relatedProgramSlug, "", 80),
    ctaLabel: clip(input.ctaLabel, "", 80),
    ctaHref: clip(input.ctaHref, "", 200),
    featured: input.featured === true || input.featured === "true",
  };
}

export type InvolvePath = {
  id: string;
  title: string;
  body: string;
  href: string;
  cta: string;
};

export function involvePathsFrom(input: unknown): InvolvePath[] {
  if (!Array.isArray(input) || input.length === 0) {
    return involvementPaths.map((path) => ({ ...path }));
  }
  return input.slice(0, 8).map((row, index) => {
    const item = asRecord(row);
    const fallback = involvementPaths[index] ?? involvementPaths[0];
    return {
      id: clip(item.id, fallback.id, 40),
      title: clip(item.title, fallback.title, 80),
      body: clip(item.body, fallback.body, 400),
      href: clip(item.href, fallback.href, 200),
      cta: clip(item.cta, fallback.cta, 80),
    };
  });
}

export type PartnerCategory = { name: string; body: string };

export function pagePayload(slug: "partnership", input: Record<string, unknown>): {
  kicker: string;
  audiences: string[];
  categories: PartnerCategory[];
};
export function pagePayload(slug: "get-involved", input: Record<string, unknown>): {
  kicker: string;
  pathways: InvolvePath[];
  prayTitle: string;
  prayBody: string;
  mentorTitle: string;
  mentorBody: string;
};
export function pagePayload(slug: string, input: Record<string, unknown>): { kicker: string };
export function pagePayload(slug: string, input: Record<string, unknown>) {
  const kicker = clip(input.kicker, "", 80);
  if (slug === "get-involved") {
    return {
      kicker,
      pathways: involvePathsFrom(input.pathways),
      prayTitle: clip(input.prayTitle, "Hold this community in prayer.", 160),
      prayBody: clip(
        input.prayBody,
        "Pray for girls managing menstruation without shame. For mentors with wisdom. For trainers and the work of their hands. For a model that can grow toward self-sufficiency. For the Word and Love of Jesus Christ to be felt as belonging, never as a condition of care.",
        2000,
      ),
      mentorTitle: clip(input.mentorTitle, "Share knowledge without taking over her story.", 160),
      mentorBody: clip(
        input.mentorBody,
        "Mentorship is accompaniment. If you can offer time, skill or a steady presence, start a conversation and we will follow up through official organisational channels.",
        2000,
      ),
    };
  }
  if (slug === "partnership") {
    const audiences = stringList(input.audiences);
    const categories = Array.isArray(input.categories)
      ? input.categories.slice(0, 12).map((row) => {
          const item = asRecord(row);
          return {
            name: clip(item.name, "", 80),
            body: clip(item.body, "", 400),
          };
        }).filter((item) => item.name)
      : [];
    return {
      kicker,
      audiences: audiences.length ? audiences : [...partnershipContent.audiences],
      categories: categories.length
        ? categories
        : partnershipContent.categories.map((item) => ({ ...item })),
    };
  }
  return { kicker };
}

export function datetimeLocalFromIso(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 16);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}T${pick("hour")}:${pick("minute")}`;
}

export function isoFromDatetimeLocal(value: string) {
  if (!value) return "";
  const normalized = value.length === 16 ? `${value}:00` : value;
  return `${normalized}+03:00`;
}
