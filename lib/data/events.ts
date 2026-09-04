import { libraryImages } from "@/lib/data/library-images";
import {
  getEventEndMs,
  isUpcomingEvent,
} from "@/lib/events/dates";

export type EventType =
  | "distribution"
  | "mentorship"
  | "discipleship"
  | "workshop"
  | "outreach"
  | "fundraiser";

export type NfsEvent = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  type: EventType;
  startsAt: string;
  endsAt?: string;
  location: string;
  locationDetail?: string;
  visual: string;
  relatedProgramSlug?: string;
  cta?: { label: string; href: string };
  featured?: boolean;
};

export const eventTypeLabels: Record<EventType, string> = {
  distribution: "Distribution",
  mentorship: "Mentorship",
  discipleship: "Discipleship",
  workshop: "Workshop",
  outreach: "Outreach",
  fundraiser: "Fundraiser",
};

const eventDefs: NfsEvent[] = [
  {
    slug: "pad-distribution-october-2026",
    title: "Pad distribution day — Kawangware",
    summary:
      "Sanitary pads, dignity kits and menstrual health education for girls in the community.",
    description:
      "A distribution day brings together dignity kits, sanitary pads, underwear and hygiene items with short sessions on menstrual health. Girls leave with what they need for the month ahead — and with knowledge that belongs to them.",
    type: "distribution",
    startsAt: "2026-10-18T10:00:00+03:00",
    endsAt: "2026-10-18T14:00:00+03:00",
    location: "Congo, Kawangware",
    locationDetail: "Venue confirmed with registered families before the day.",
    visual: libraryImages.padDistribution1,
    relatedProgramSlug: "dignity-kits",
    cta: { label: "Help provide a dignity kit", href: "/donate?cause=dignity-kits" },
    featured: true,
  },
  {
    slug: "mentorship-gathering-november-2026",
    title: "Mentorship gathering",
    summary:
      "A morning for mentors and girls — conversation, guidance and community.",
    description:
      "Mentorship is accompaniment. This gathering brings mentors and girls together for guided conversation, peer support and the steady presence of adults who walk beside them without taking over their stories.",
    type: "mentorship",
    startsAt: "2026-11-08T09:30:00+03:00",
    endsAt: "2026-11-08T12:30:00+03:00",
    location: "Congo, Kawangware",
    visual: libraryImages.mentorship,
    relatedProgramSlug: "mentorship",
    cta: { label: "Offer to mentor", href: "/contact?intent=mentorship" },
    featured: true,
  },
  {
    slug: "skills-workshop-december-2026",
    title: "Skills workshop — sewing basics",
    summary:
      "A practical afternoon introducing sewing skills for girls in the vocational pathway.",
    description:
      "Hands-on sewing practice for girls beginning their vocational journey. The session covers basic stitching, machine safety and the first steps toward making simple garments — skill offered as dignity, not display.",
    type: "workshop",
    startsAt: "2026-12-06T10:00:00+03:00",
    endsAt: "2026-12-06T13:00:00+03:00",
    location: "Congo, Kawangware",
    visual: libraryImages.skill,
    relatedProgramSlug: "vocational-training",
    cta: { label: "Support vocational training", href: "/donate?cause=vocational" },
  },
  {
    slug: "discipleship-gathering-july-2026",
    title: "Community discipleship gathering",
    summary:
      "Prayer, the Word and fellowship — faith offered as belonging, not as a condition of care.",
    description:
      "Nazarene for She is rooted in a community that gathers to share the Word and Love of Jesus Christ. Discipleship, prayer and spiritual encouragement sit alongside practical support — never instead of it.",
    type: "discipleship",
    startsAt: "2026-07-12T15:00:00+03:00",
    endsAt: "2026-07-12T17:30:00+03:00",
    location: "Congo, Kawangware",
    visual: libraryImages.community,
    relatedProgramSlug: "discipleship",
    cta: { label: "Pray with us", href: "/get-involved#pray" },
  },
  {
    slug: "pad-distribution-may-2026",
    title: "Pad distribution day — May",
    summary:
      "Dignity kits and menstrual health education shared with girls and caregivers.",
    description:
      "An earlier distribution day in the year — pads, underwear and hygiene items alongside short teaching on menstrual health, so girls can stay in school with less fear and less shame.",
    type: "distribution",
    startsAt: "2026-05-17T10:00:00+03:00",
    endsAt: "2026-05-17T13:30:00+03:00",
    location: "Congo, Kawangware",
    visual: libraryImages.padDistribution2,
    relatedProgramSlug: "dignity-kits",
    cta: { label: "Help provide a dignity kit", href: "/donate?cause=dignity-kits" },
  },
  {
    slug: "menstrual-health-workshop-march-2026",
    title: "Menstrual health workshop",
    summary:
      "A focused session on body literacy, hygiene and confidence for adolescent girls.",
    description:
      "Girls and a few caregivers gathered for clear teaching on menstrual health — what changes, what to expect, and how to care for themselves with the kits they receive. Knowledge shared without shame.",
    type: "workshop",
    startsAt: "2026-03-22T11:00:00+03:00",
    endsAt: "2026-03-22T13:30:00+03:00",
    location: "Congo, Kawangware",
    visual: libraryImages.menstrualHealth,
    relatedProgramSlug: "menstrual-health",
    cta: { label: "Support this work", href: "/donate" },
  },
];

export const events = eventDefs.map((event) => ({ ...event }));

export function getEvent(slug: string) {
  return events.find((event) => event.slug === slug);
}

export function sortByStartAsc(a: NfsEvent, b: NfsEvent) {
  return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
}

export function sortByStartDesc(a: NfsEvent, b: NfsEvent) {
  return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
}

export function upcomingEvents(now = new Date()) {
  return events.filter((event) => isUpcomingEvent(event, now)).sort(sortByStartAsc);
}

export function pastEvents(now = new Date()) {
  return events.filter((event) => !isUpcomingEvent(event, now)).sort(sortByStartDesc);
}

export function featuredUpcomingEvents(limit = 2, now = new Date()) {
  return upcomingEvents(now)
    .filter((event) => event.featured)
    .slice(0, limit);
}

export function getEventEnd(event: NfsEvent) {
  return new Date(getEventEndMs(event));
}

export const eventSlugs = events.map((event) => event.slug);
