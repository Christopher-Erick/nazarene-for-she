"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { eventTypeLabels, type EventType } from "@/lib/data/events";
import {
  formatNairobiDayLabel,
  formatNairobiMonthTitle,
  getNairobiMonthGrid,
  groupEventsByDateKey,
  nairobiNoon,
  parseDateKey,
  shiftNairobiMonth,
  WEEKDAY_LABELS,
} from "@/lib/events/calendar";
import {
  formatEventDateBadge,
  formatEventDate,
  formatEventTime,
  isUpcomingEvent,
} from "@/lib/events/dates";
import "./events-calendar.css";

export type CalendarEventItem = {
  slug: string;
  title: string;
  summary: string;
  type: EventType;
  startsAt: string;
  endsAt?: string;
  location: string;
  visual: string;
  cta?: { label: string; href: string };
};

function badgeForDateKey(dateKey: string) {
  const { year, month, day } = parseDateKey(dateKey);
  return formatEventDateBadge(nairobiNoon(year, month, day).toISOString());
}

export function EventsCalendar({
  events,
  todayKey,
  initialYear,
  initialMonth,
  initialSelectedKey,
  searching = false,
  onVisibleMonthChange,
}: {
  events: CalendarEventItem[];
  todayKey: string;
  initialYear: number;
  initialMonth: number;
  initialSelectedKey: string;
  searching?: boolean;
  onVisibleMonthChange?: (year: number, month: number) => void;
}) {
  const [monthCursor, setMonthCursor] = useState({ year: initialYear, month: initialMonth });
  const [selectedKey, setSelectedKey] = useState(initialSelectedKey);

  const eventsByDay = useMemo(() => groupEventsByDateKey(events), [events]);
  const grid = useMemo(
    () => getNairobiMonthGrid(monthCursor.year, monthCursor.month),
    [monthCursor.month, monthCursor.year],
  );
  const selectedEvents = eventsByDay.get(selectedKey) ?? [];
  const monthTitle = formatNairobiMonthTitle(monthCursor.year, monthCursor.month);
  const selectedLabel = formatNairobiDayLabel(selectedKey);
  const selectedBadge = badgeForDateKey(selectedKey);

  function showMonth(delta: number) {
    const next = shiftNairobiMonth(monthCursor.year, monthCursor.month, delta);
    setMonthCursor(next);
    onVisibleMonthChange?.(next.year, next.month);

    const monthPrefix = `${next.year}-${String(next.month).padStart(2, "0")}-`;
    const firstEventKey = [...eventsByDay.keys()]
      .filter((key) => key.startsWith(monthPrefix))
      .sort()[0];
    if (firstEventKey) setSelectedKey(firstEventKey);
  }

  function selectDay(dateKey: string, inCurrentMonth: boolean) {
    if (!inCurrentMonth) {
      const { year, month } = parseDateKey(dateKey);
      setMonthCursor({ year, month });
      onVisibleMonthChange?.(year, month);
    }
    setSelectedKey(dateKey);
  }

  return (
    <div
      id="nfs-event-calendar"
      className="event-cal"
      style={{ display: "grid" }}
    >
      <div className="event-cal__month">
        <div className="event-cal__toolbar">
          <button
            type="button"
            className="event-cal__nav"
            aria-label="Previous month"
            onClick={() => showMonth(-1)}
          >
            ‹
          </button>
          <h3 className="event-cal__title">{monthTitle}</h3>
          <button
            type="button"
            className="event-cal__nav"
            aria-label="Next month"
            onClick={() => showMonth(1)}
          >
            ›
          </button>
        </div>

        <div
          className="event-cal__weekdays"
          aria-hidden="true"
          style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
        >
          {WEEKDAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div
          className="event-cal__grid"
          role="grid"
          aria-label={`${monthTitle} calendar`}
          style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
        >
          {grid.map((cell) => {
            const dayEvents = eventsByDay.get(cell.dateKey) ?? [];
            const hasEvent = dayEvents.length > 0;
            const upcoming = dayEvents.some((event) => isUpcomingEvent(event));
            const isToday = cell.dateKey === todayKey;
            const isSelected = cell.dateKey === selectedKey;
            const names = dayEvents.map((event) => event.title).join(", ");
            const dayLabel = formatNairobiDayLabel(cell.dateKey);

            return (
              <button
                key={cell.dateKey}
                type="button"
                role="gridcell"
                className="event-cal__day"
                data-outside={cell.inCurrentMonth ? "false" : "true"}
                data-today={isToday ? "true" : "false"}
                data-selected={isSelected ? "true" : "false"}
                data-has-event={hasEvent ? "true" : "false"}
                data-upcoming={upcoming ? "true" : "false"}
                aria-current={isToday ? "date" : undefined}
                aria-pressed={isSelected}
                aria-label={hasEvent ? `${dayLabel}, ${names}` : dayLabel}
                onClick={() => selectDay(cell.dateKey, cell.inCurrentMonth)}
              >
                <span className="event-cal__num">{cell.day}</span>
                <span className="event-cal__mark" aria-hidden="true" />
              </button>
            );
          })}
        </div>

        <p className="event-cal__legend">
          <span className="event-cal__legend-item">
            <span className="event-cal__legend-swatch" data-kind="upcoming" />
            Upcoming
          </span>
          <span className="event-cal__legend-item">
            <span className="event-cal__legend-swatch" data-kind="selected" />
            Selected
          </span>
        </p>
      </div>

      <div className="event-cal__panel">
        {selectedEvents.length === 0 ? (
          <div className="event-cal__empty">
            <div className="event-cal__stamp" aria-hidden="true">
              <span className="event-cal__stamp-day">{selectedBadge.day}</span>
              <span className="event-cal__stamp-month">{selectedBadge.month}</span>
            </div>
            <div>
              <p className="event-cal__empty-kicker">{selectedLabel}</p>
              <p className="event-cal__empty-title">A quiet day.</p>
              <p className="event-cal__empty-copy">
                {searching
                  ? "Nothing on this date matches that search. Try another word, or open a gold date."
                  : "Gold marks upcoming gatherings. Open one of those dates to see the details."}
              </p>
            </div>
          </div>
        ) : (
          <ul className="event-cal__list">
            {selectedEvents.map((event) => {
              const upcoming = isUpcomingEvent(event);
              const badge = formatEventDateBadge(event.startsAt);
              const time = event.endsAt
                ? `${formatEventTime(event.startsAt)} – ${formatEventTime(event.endsAt)}`
                : formatEventTime(event.startsAt);

              return (
                <li key={event.slug}>
                  <article className="event-cal__ticket">
                    <div className="event-cal__photo">
                      <Image
                        src={event.visual}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 28rem, 80vw"
                        quality={90}
                        className="object-contain object-center"
                      />
                      <div className="event-cal__stamp event-cal__stamp--on-photo" aria-hidden="true">
                        <span className="event-cal__stamp-day">{badge.day}</span>
                        <span className="event-cal__stamp-month">{badge.month}</span>
                      </div>
                    </div>
                    <div className="event-cal__copy">
                      <p className="event-cal__ticket-type">{eventTypeLabels[event.type]}</p>
                      <h4 className="event-cal__ticket-title">{event.title}</h4>
                      <p className="event-cal__ticket-summary">{event.summary}</p>
                      <p className="event-cal__ticket-meta">{formatEventDate(event.startsAt)}</p>
                      <p className="event-cal__ticket-meta">
                        {time} · {event.location}
                      </p>
                      <div className="event-cal__ticket-actions">
                        <Link href={`/events/${event.slug}`} className="event-cal__ticket-cta">
                          {upcoming ? "View details" : "See what happened"} →
                        </Link>
                        {upcoming ? (
                          <Link
                            href={event.cta?.href ?? "/donate"}
                            className="btn btn-plum event-cal__ticket-support"
                          >
                            Support this event
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
