import { EventCard } from "@/components/events/EventCard";
import { PageIntro } from "@/components/ui/PageIntro";
import { PlaceholderNote } from "@/components/ui/PlaceholderNote";
import { pastEvents, upcomingEvents } from "@/lib/data/events";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "Events",
  description:
    "Upcoming pad distributions, mentorship gatherings and community events with Nazarene for She in Kawangware, Nairobi.",
  path: "/events",
});

export default function EventsPage() {
  const upcoming = upcomingEvents();
  const past = pastEvents();

  return (
    <>
      <PageIntro
        kicker="Events"
        title="Show up where the work is happening."
      >
        <p>
          Distributions, mentorship, discipleship and workshops — dates and places to walk
          beside girls and young women in Kawangware. Past events stay here as a record of
          what we have done together.
        </p>
      </PageIntro>

      <div className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <section aria-labelledby="upcoming-events-heading">
          <h2 id="upcoming-events-heading" className="font-display text-3xl">
            Upcoming
          </h2>
          {upcoming.length === 0 ? (
            <PlaceholderNote>
              No upcoming events right now. Check back soon or{" "}
              <a href="/contact" className="text-primary underline-offset-4 hover:underline">
                start a conversation
              </a>{" "}
              if you would like to visit.
            </PlaceholderNote>
          ) : (
            <div className="mt-8 grid gap-10 lg:grid-cols-2">
              {upcoming.map((event) => (
                <EventCard key={event.slug} event={event} />
              ))}
            </div>
          )}
        </section>

        {past.length > 0 ? (
          <section className="mt-20 border-t border-line pt-16" aria-labelledby="past-events-heading">
            <h2 id="past-events-heading" className="font-display text-3xl">
              Past events
            </h2>
            <p className="mt-3 max-w-2xl text-muted">
              Archived automatically after each event ends. Pages stay available as a record
              of the community&apos;s work.
            </p>
            <div className="mt-8 grid gap-8">
              {past.map((event) => (
                <EventCard key={event.slug} event={event} compact />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
