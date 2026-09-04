import {
  eventTypeLabels,
  sortByStartAsc,
  sortByStartDesc,
  type NfsEvent,
} from "@/lib/data/events";

export type EventSort = "soonest" | "latest" | "title" | "type";

export const eventSortOptions: { value: EventSort; label: string }[] = [
  { value: "soonest", label: "Soonest first" },
  { value: "latest", label: "Latest first" },
  { value: "title", label: "Title A–Z" },
  { value: "type", label: "By type" },
];

export function eventMatchesQuery(event: NfsEvent, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return [
    event.title,
    event.summary,
    event.description,
    event.location,
    event.locationDetail,
    eventTypeLabels[event.type],
  ]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(needle));
}

export function compareEvents(a: NfsEvent, b: NfsEvent, sort: EventSort) {
  if (sort === "latest") return sortByStartDesc(a, b);
  if (sort === "title") return a.title.localeCompare(b.title, "en");
  if (sort === "type") {
    const byType = eventTypeLabels[a.type].localeCompare(eventTypeLabels[b.type], "en");
    return byType || sortByStartAsc(a, b);
  }
  return sortByStartAsc(a, b);
}
