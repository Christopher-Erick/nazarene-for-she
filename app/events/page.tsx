import { EventsBoard } from "@/components/events/EventsBoard";
import {
  sortByStartAsc,
  sortByStartDesc,
} from "@/lib/data/events";
import { publishedEvents } from "@/lib/cms/public-content";
import { isUpcomingEvent } from "@/lib/events/dates";
import { parseDateKey, toNairobiDateKey } from "@/lib/events/calendar";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "Events",
  description:
    "Upcoming pad distributions, mentorship gatherings and community events with Nazarene for She in Kawangware, Nairobi.",
  path: "/events",
});

export default async function EventsPage() {
  const all = await publishedEvents();
  const now = new Date();
  const upcoming = all.filter((event) => isUpcomingEvent(event, now)).sort(sortByStartAsc);
  const past = all.filter((event) => !isUpcomingEvent(event, now)).sort(sortByStartDesc);
  const todayKey = toNairobiDateKey(new Date());
  const initialSelectedKey = upcoming[0]
    ? toNairobiDateKey(upcoming[0].startsAt)
    : todayKey;
  const { year: initialYear, month: initialMonth } = parseDateKey(initialSelectedKey);

  return (
    <div className="mx-auto max-w-[90rem] px-5 pt-10 pb-24 sm:px-8 lg:pt-12">
      <EventsBoard
        upcoming={upcoming}
        past={past}
        todayKey={todayKey}
        initialYear={initialYear}
        initialMonth={initialMonth}
        initialSelectedKey={initialSelectedKey}
      />
    </div>
  );
}
