import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackView } from "@/components/analytics/TrackView";
import { analyticsEvents } from "@/lib/analytics";
import { ButtonLink } from "@/components/ui/ButtonLink";
import {
  eventTypeLabels,
  events,
  getEvent,
} from "@/lib/data/events";
import { getProgram } from "@/lib/data/programs";
import { site } from "@/lib/data/site";
import {
  formatEventSchedule,
  isUpcomingEvent,
} from "@/lib/events/dates";
import { escapeJsonForScript } from "@/lib/security";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export function generateStaticParams() {
  return events.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) return {};
  return pageMetadata({
    title: event.title,
    description: event.summary,
    path: `/events/${event.slug}`,
  });
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  const upcoming = isUpcomingEvent(event);
  const relatedProgram = event.relatedProgramSlug
    ? getProgram(event.relatedProgramSlug)
    : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.startsAt,
    endDate: event.endsAt ?? event.startsAt,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: upcoming
      ? "https://schema.org/EventScheduled"
      : "https://schema.org/EventPast",
    location: {
      "@type": "Place",
      name: event.location,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Kawangware",
        addressRegion: "Nairobi",
        addressCountry: "KE",
      },
    },
    organizer: {
      "@type": "NGO",
      name: site.name,
      url: site.url,
    },
    image: `${site.url}${event.visual}`,
  };

  return (
    <>
      <TrackView event={analyticsEvents.eventViewed} id={event.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonForScript(jsonLd) }}
      />
      <header className="bleed-hero relative min-h-[48vh] overflow-hidden bg-plum text-ivory">
        <div className="absolute inset-0">
          <Image
            src={event.visual}
            alt=""
            fill
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            quality={80}
            className="object-cover opacity-55"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-plum via-plum/70 to-plum/30" />
        <div className="relative mx-auto flex min-h-[48vh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 sm:px-8">
          <p className="eyebrow text-accent">{eventTypeLabels[event.type]}</p>
          <h1 className="display-lg mt-4 max-w-4xl">{event.title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-ivory/85">{event.summary}</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {!upcoming ? (
            <p className="event-ended-note">This event has ended.</p>
          ) : null}
          <h2 className="font-display text-3xl">About this gathering</h2>
          <p className="mt-4 text-lg text-muted">{event.description}</p>
          {event.locationDetail ? (
            <p className="mt-6 text-muted">{event.locationDetail}</p>
          ) : null}
        </div>

        <aside className="lg:col-span-4">
          <div className="border border-line bg-surface p-6">
            <p className="eyebrow text-primary">When & where</p>
            <dl className="event-detail-list mt-4">
              <div>
                <dt>Date</dt>
                <dd>{formatEventSchedule(event)}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{event.location}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col gap-3">
              {upcoming && event.cta ? (
                <ButtonLink href={event.cta.href} variant="plum">
                  {event.cta.label}
                </ButtonLink>
              ) : (
                <ButtonLink href="/events" variant="plum">
                  View upcoming events
                </ButtonLink>
              )}
              <ButtonLink href="/contact" variant="ghost">
                Ask a question
              </ButtonLink>
            </div>
          </div>

          {relatedProgram ? (
            <div className="mt-6 border border-line bg-background p-6">
              <p className="eyebrow text-primary">Related programme</p>
              <p className="mt-3 font-display text-2xl">{relatedProgram.name}</p>
              <p className="mt-2 text-sm text-muted">{relatedProgram.summary}</p>
              <Link
                href={`/programs/${relatedProgram.slug}`}
                className="mt-4 inline-block text-sm font-semibold text-primary"
              >
                Discover this work →
              </Link>
            </div>
          ) : null}
        </aside>
      </div>

      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <ButtonLink href="/events" variant="ghost">
          All events
        </ButtonLink>
      </section>
    </>
  );
}
