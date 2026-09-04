import { EVENT_TIMEZONE } from "./dates.ts";

export type CalendarCell = {
  dateKey: string;
  day: number;
  inCurrentMonth: boolean;
};

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TIMEZONE,
  weekday: "short",
});

const WEEKDAY_SUN0: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function nairobiNoon(year: number, month: number, day: number) {
  return new Date(`${year}-${pad2(month)}-${pad2(day)}T12:00:00+03:00`);
}

export function toNairobiDateKey(input: Date | string) {
  const date = typeof input === "string" ? new Date(input) : input;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: EVENT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return { year, month, day };
}

export function nairobiWeekdaySun0(date: Date) {
  return WEEKDAY_SUN0[weekdayFormatter.format(date)] ?? 0;
}

export function shiftNairobiMonth(year: number, month: number, delta: number) {
  const index = year * 12 + (month - 1) + delta;
  return {
    year: Math.floor(index / 12),
    month: (index % 12) + 1,
  };
}

export function daysInNairobiMonth(year: number, month: number) {
  const next = shiftNairobiMonth(year, month, 1);
  const startOfNext = new Date(`${next.year}-${pad2(next.month)}-01T00:00:00+03:00`);
  return parseDateKey(toNairobiDateKey(new Date(startOfNext.getTime() - 1))).day;
}

export function formatNairobiMonthTitle(year: number, month: number) {
  return new Intl.DateTimeFormat("en-KE", {
    timeZone: EVENT_TIMEZONE,
    month: "long",
    year: "numeric",
  }).format(nairobiNoon(year, month, 1));
}

export function formatNairobiDayLabel(dateKey: string) {
  const { year, month, day } = parseDateKey(dateKey);
  return new Intl.DateTimeFormat("en-KE", {
    timeZone: EVENT_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(nairobiNoon(year, month, day));
}

export function getNairobiMonthGrid(year: number, month: number): CalendarCell[] {
  const days = daysInNairobiMonth(year, month);
  const firstWeekday = nairobiWeekdaySun0(nairobiNoon(year, month, 1));
  const prev = shiftNairobiMonth(year, month, -1);
  const prevDays = daysInNairobiMonth(prev.year, prev.month);
  const next = shiftNairobiMonth(year, month, 1);
  const cells: CalendarCell[] = [];

  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    const day = prevDays - i;
    cells.push({
      dateKey: `${prev.year}-${pad2(prev.month)}-${pad2(day)}`,
      day,
      inCurrentMonth: false,
    });
  }

  for (let day = 1; day <= days; day += 1) {
    cells.push({
      dateKey: `${year}-${pad2(month)}-${pad2(day)}`,
      day,
      inCurrentMonth: true,
    });
  }

  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({
      dateKey: `${next.year}-${pad2(next.month)}-${pad2(nextDay)}`,
      day: nextDay,
      inCurrentMonth: false,
    });
    nextDay += 1;
  }

  return cells;
}

export function groupEventsByDateKey<T extends { startsAt: string }>(events: T[]) {
  const grouped = new Map<string, T[]>();

  for (const event of events) {
    const key = toNairobiDateKey(event.startsAt);
    const existing = grouped.get(key);
    if (existing) existing.push(event);
    else grouped.set(key, [event]);
  }

  return grouped;
}
