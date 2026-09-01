export const EVENT_TIMEZONE = "Africa/Nairobi";

export function getEventEndMs(event: { startsAt: string; endsAt?: string }): number {
  if (event.endsAt) return new Date(event.endsAt).getTime();

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: EVENT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date(event.startsAt));
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return new Date(event.startsAt).getTime();
  }

  return new Date(`${year}-${month}-${day}T23:59:59+03:00`).getTime();
}

export function isUpcomingEvent(
  event: { startsAt: string; endsAt?: string },
  now = new Date(),
): boolean {
  return getEventEndMs(event) >= now.getTime();
}

const dateFormatter = new Intl.DateTimeFormat("en-KE", {
  timeZone: EVENT_TIMEZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-KE", {
  timeZone: EVENT_TIMEZONE,
  hour: "numeric",
  minute: "2-digit",
});

const monthDayFormatter = new Intl.DateTimeFormat("en-KE", {
  timeZone: EVENT_TIMEZONE,
  month: "short",
});

const dayFormatter = new Intl.DateTimeFormat("en-KE", {
  timeZone: EVENT_TIMEZONE,
  day: "numeric",
});

export function formatEventDate(iso: string) {
  return dateFormatter.format(new Date(iso));
}

export function formatEventTime(iso: string) {
  return timeFormatter.format(new Date(iso));
}

export function formatEventDateBadge(iso: string) {
  return {
    day: dayFormatter.format(new Date(iso)),
    month: monthDayFormatter.format(new Date(iso)),
  };
}

export function formatEventSchedule(event: {
  startsAt: string;
  endsAt?: string;
}) {
  const startDate = formatEventDate(event.startsAt);
  const startTime = formatEventTime(event.startsAt);

  if (!event.endsAt) {
    return `${startDate} · ${startTime}`;
  }

  const endDate = formatEventDate(event.endsAt);
  const endTime = formatEventTime(event.endsAt);

  if (startDate === endDate) {
    return `${startDate} · ${startTime} – ${endTime}`;
  }

  return `${startDate} · ${startTime} – ${endDate} · ${endTime}`;
}
