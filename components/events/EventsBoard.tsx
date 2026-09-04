"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EventCard } from "@/components/events/EventCard";
import {
  EventsCalendar,
  type CalendarEventItem,
} from "@/components/events/EventsCalendar";
import { PlaceholderNote } from "@/components/ui/PlaceholderNote";
import type { NfsEvent } from "@/lib/data/events";
import { pad2, parseDateKey, toNairobiDateKey } from "@/lib/events/calendar";
import {
  compareEvents,
  eventMatchesQuery,
  eventSortOptions,
  type EventSort,
} from "@/lib/events/find";
import "./events-calendar.css";

function eventMonthKey(event: { startsAt: string }) {
  const dateKey = toNairobiDateKey(event.startsAt);
  return dateKey.slice(0, 7);
}

function toCalendarEvent(event: NfsEvent): CalendarEventItem {
  return {
    slug: event.slug,
    title: event.title,
    summary: event.summary,
    type: event.type,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    location: event.location,
    visual: event.visual,
    cta: event.cta,
  };
}

export function EventsBoard({
  upcoming,
  past,
  todayKey,
  initialYear,
  initialMonth,
  initialSelectedKey,
}: {
  upcoming: NfsEvent[];
  past: NfsEvent[];
  todayKey: string;
  initialYear: number;
  initialMonth: number;
  initialSelectedKey: string;
}) {
  const [visibleMonth, setVisibleMonth] = useState(
    `${initialYear}-${pad2(initialMonth)}`,
  );
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<EventSort>("soonest");

  const searching = Boolean(query.trim());

  const filteredUpcoming = useMemo(
    () => upcoming.filter((event) => eventMatchesQuery(event, query)).sort((a, b) => compareEvents(a, b, sort)),
    [upcoming, query, sort],
  );

  const filteredPast = useMemo(
    () => past.filter((event) => eventMatchesQuery(event, query)).sort((a, b) => compareEvents(a, b, sort)),
    [past, query, sort],
  );

  const calendarEvents = useMemo(
    () => filteredUpcoming.map(toCalendarEvent),
    [filteredUpcoming],
  );

  const focusDateKey = searching && filteredUpcoming[0]
    ? toNairobiDateKey(filteredUpcoming[0].startsAt)
    : undefined;
  const focusParts = focusDateKey ? parseDateKey(focusDateKey) : null;

  const listedUpcoming = filteredUpcoming.filter((event) => {
    const hideMonth = focusDateKey ? focusDateKey.slice(0, 7) : visibleMonth;
    return eventMonthKey(event) !== hideMonth;
  });

  const matchCount = filteredUpcoming.length + filteredPast.length;

  const handleVisibleMonth = useCallback((year: number, month: number) => {
    setVisibleMonth(`${year}-${pad2(month)}`);
  }, []);

  useEffect(() => {
    if (focusDateKey) {
      const { year, month } = parseDateKey(focusDateKey);
      setVisibleMonth(`${year}-${pad2(month)}`);
      return;
    }
    setVisibleMonth(`${initialYear}-${pad2(initialMonth)}`);
  }, [focusDateKey, initialYear, initialMonth]);

  return (
    <div className="event-shell">
      <aside className="event-side" aria-label="Sort and past events">
        <div className="event-find__sort">
          <label htmlFor="event-sort">Sort</label>
          <select
            id="event-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as EventSort)}
          >
            {eventSortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {past.length > 0 ? (
          <section className="event-past" aria-labelledby="past-events-heading">
            <div className="event-past__head">
              <h2 id="past-events-heading">Past events</h2>
              <p>
                {searching && filteredPast.length > 0
                  ? "Matching gatherings that have already taken place."
                  : "Archived automatically after a gathering ends."}
              </p>
            </div>

            {filteredPast.length > 0 ? (
              <div className="event-past__list">
                {filteredPast.map((event) => (
                  <EventCard key={event.slug} event={event} compact />
                ))}
              </div>
            ) : searching ? (
              <p className="event-past__empty">No past gatherings match that search.</p>
            ) : null}
          </section>
        ) : null}
      </aside>

      <div className="event-main">
        <header className="event-intro">
          <div className="event-intro__lead">
            <h1 className="display-md event-intro__title">Event calendar</h1>
            <p className="event-intro__blurb">
              Gold marks a gathering. Open a date for the details.
            </p>
          </div>

          <form
            className="event-find"
            role="search"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="event-find__search">
              <label htmlFor="event-search">Search gatherings</label>
              <div className="event-find__field">
                <span className="event-find__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.75" />
                    <path
                      d="M16.2 16.2 20 20"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <input
                  id="event-search"
                  type="search"
                  value={query}
                  placeholder="Title, place or type"
                  autoComplete="off"
                  onChange={(event) => setQuery(event.target.value)}
                />
                {searching ? (
                  <button type="button" className="event-find__clear" onClick={() => setQuery("")}>
                    Clear
                  </button>
                ) : null}
              </div>
            </div>

            <p className="event-find__status" aria-live="polite">
              {searching
                ? matchCount === 0
                  ? `No gatherings match “${query.trim()}”.`
                  : `${matchCount} ${matchCount === 1 ? "gathering matches" : "gatherings match"}.`
                : `${upcoming.length} upcoming · ${past.length} past`}
            </p>
          </form>
        </header>

        <section aria-labelledby="events-calendar-heading">
          <h2 id="events-calendar-heading" className="sr-only">
            Upcoming calendar
          </h2>
          <EventsCalendar
            key={focusDateKey ?? "browse"}
            events={calendarEvents}
            todayKey={todayKey}
            initialYear={focusParts?.year ?? initialYear}
            initialMonth={focusParts?.month ?? initialMonth}
            initialSelectedKey={focusDateKey ?? initialSelectedKey}
            searching={searching}
            onVisibleMonthChange={handleVisibleMonth}
          />

          {upcoming.length === 0 ? (
            <PlaceholderNote>
              No upcoming events right now. Check back soon or{" "}
              <a href="/contact" className="text-primary underline-offset-4 hover:underline">
                start a conversation
              </a>{" "}
              if you would like to visit.
            </PlaceholderNote>
          ) : listedUpcoming.length > 0 ? (
            <div className="event-also">
              <h2 className="font-display text-3xl">
                {searching ? "Other matches" : "Also coming up"}
              </h2>
              <p className="mt-3 max-w-2xl text-muted">
                {searching
                  ? "Matching gatherings not on this month of the calendar."
                  : "Other gatherings not on this month of the calendar."}
              </p>
              <div className="mt-8 grid gap-10 lg:grid-cols-2">
                {listedUpcoming.map((event) => (
                  <EventCard key={event.slug} event={event} />
                ))}
              </div>
            </div>
          ) : searching && matchCount === 0 ? (
            <p className="mt-10 max-w-xl text-muted">
              Try another word — title, place, or type such as mentorship or distribution.
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
