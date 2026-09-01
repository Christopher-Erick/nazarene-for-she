import Image from "next/image";
import Link from "next/link";
import {
  eventTypeLabels,
  type NfsEvent,
} from "@/lib/data/events";
import {
  formatEventDateBadge,
  formatEventSchedule,
  isUpcomingEvent,
} from "@/lib/events/dates";

export function EventCard({
  event,
  compact = false,
}: {
  event: NfsEvent;
  compact?: boolean;
}) {
  const upcoming = isUpcomingEvent(event);
  const badge = formatEventDateBadge(event.startsAt);

  if (compact) {
    return (
      <article className="border-t border-line pt-8">
        <Link
          href={`/events/${event.slug}`}
          className="group flex items-start gap-5 text-inherit no-underline"
        >
          <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-plum sm:h-[6.5rem] sm:w-[6.5rem]">
            <Image
              src={event.visual}
              alt=""
              width={208}
              height={208}
              quality={80}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            />
            <div
              className="absolute top-2 left-2 z-[1] grid min-w-[2.75rem] rounded-md bg-plum/82 px-1.5 py-1 text-center text-ivory leading-none"
              aria-hidden="true"
            >
              <span className="font-display text-lg font-semibold">{badge.day}</span>
              <span className="mt-0.5 text-[0.65rem] tracking-[0.08em] uppercase">
                {badge.month}
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <p className="eyebrow text-accent">{eventTypeLabels[event.type]}</p>
            <h2 className="mt-2 font-display text-3xl tracking-tight">{event.title}</h2>
            <p className="mt-2 text-sm text-muted">{formatEventSchedule(event)}</p>
            <p className="mt-1 text-sm text-muted">{event.location}</p>
            <span className="mt-4 inline-block text-sm font-semibold text-primary">
              See what happened →
            </span>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="border-t border-line pt-8">
      <Link
        href={`/events/${event.slug}`}
        className="group grid gap-5 text-inherit no-underline sm:grid-cols-5"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-plum sm:col-span-2">
          <Image
            src={event.visual}
            alt=""
            fill
            sizes="(min-width: 1024px) 20vw, 100vw"
            quality={80}
            className="object-cover transition duration-700 group-hover:scale-[1.03]"
          />
          <div
            className="absolute top-3 left-3 z-[1] grid min-w-[3.25rem] rounded-md bg-plum/82 px-2 py-1.5 text-center text-ivory leading-none"
            aria-hidden="true"
          >
            <span className="font-display text-[1.35rem] font-semibold">{badge.day}</span>
            <span className="mt-0.5 text-[0.72rem] tracking-[0.08em] uppercase">
              {badge.month}
            </span>
          </div>
        </div>

        <div className="sm:col-span-3">
          <p className="eyebrow text-accent">{eventTypeLabels[event.type]}</p>
          <h2 className="mt-2 font-display text-3xl tracking-tight">{event.title}</h2>
          <p className="mt-2 text-sm text-muted">{formatEventSchedule(event)}</p>
          <p className="mt-1 text-sm text-muted">{event.location}</p>
          <p className="mt-3 text-muted">{event.summary}</p>
          <span className="mt-4 inline-block text-sm font-semibold text-primary">
            {upcoming ? "View details →" : "See what happened →"}
          </span>
        </div>
      </Link>
    </article>
  );
}
