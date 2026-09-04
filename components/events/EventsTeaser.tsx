import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PlaceholderNote } from "@/components/ui/PlaceholderNote";
import { publishedEvents } from "@/lib/cms/public-content";
import { isUpcomingEvent, formatEventSchedule } from "@/lib/events/dates";
import { sortByStartAsc } from "@/lib/data/events";

export async function EventsTeaser() {
  const featured = (await publishedEvents())
    .filter((event) => event.featured && isUpcomingEvent(event))
    .sort(sortByStartAsc)
    .slice(0, 2);

  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <p className="eyebrow text-primary">Events</p>
        <h2 className="display-md mt-4 max-w-3xl">Walk with us in person.</h2>
        <p className="mt-5 max-w-2xl text-lg text-muted">
          Distributions, mentorship gatherings and community meet-ups — dates and places
          where you can show up alongside the work.
        </p>

        {featured.length === 0 ? (
          <PlaceholderNote>
            New events will be posted here as dates are confirmed.
          </PlaceholderNote>
        ) : (
          <ul className="event-teaser-list mt-10">
            {featured.map((event) => (
              <li key={event.slug}>
                <Link href={`/events/${event.slug}`} className="event-teaser-item">
                  <span className="event-teaser-item__when">{formatEventSchedule(event)}</span>
                  <span className="event-teaser-item__title">{event.title}</span>
                  <span className="event-teaser-item__location">{event.location}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10">
          <ButtonLink href="/events" variant="plum">
            View all events
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
