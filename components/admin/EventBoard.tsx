"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { WorkflowBar } from "@/components/admin/WorkflowBar";
import { useAdminList } from "@/components/admin/useAdminContent";
import { adminEditPath } from "@/lib/cms/admin-paths";
import { datetimeLocalFromIso, isoFromDatetimeLocal } from "@/lib/cms/shapes";
import { eventTypeLabels, type EventType } from "@/lib/data/events";
import { formatEventSchedule, isUpcomingEvent } from "@/lib/events/dates";

export function EventBoard() {
  const { items, error, message, create, remove, refresh, setError } = useAdminList("events");
  const [open, setOpen] = useState(false);

  const mapped = items.map((item) => ({
    item,
    startsAt: String(item.payload.startsAt ?? ""),
    type: String(item.payload.type ?? "outreach") as EventType,
  }));
  const upcoming = mapped.filter((row) => row.startsAt && isUpcomingEvent({ startsAt: row.startsAt, endsAt: String(row.item.payload.endsAt || "") || undefined }));
  const past = mapped.filter((row) => !upcoming.includes(row));

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await create({
        title: String(form.get("title") ?? ""),
        excerpt: String(form.get("summary") ?? ""),
        content: String(form.get("description") ?? ""),
        payload: {
          type: String(form.get("type") ?? "outreach"),
          startsAt: isoFromDatetimeLocal(String(form.get("startsAt") ?? "")),
          endsAt: isoFromDatetimeLocal(String(form.get("endsAt") ?? "")),
          location: String(form.get("location") ?? "Congo, Kawangware"),
          featured: false,
        },
      });
      event.currentTarget.reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that event.");
    }
  }

  function Group({ title, rows }: { title: string; rows: typeof mapped }) {
    return (
      <section className="mt-10">
        <h2 className="font-display text-2xl">{title}</h2>
        <div className="admin-piece-grid mt-4">
          {rows.length ? (
            rows.map(({ item, type, startsAt }) => (
              <article key={item.id} className="admin-piece">
                <div className="admin-piece-top">
                  <p className="eyebrow text-accent">{eventTypeLabels[type] ?? type}</p>
                  <StatusBadge status={item.status} />
                </div>
                <h3 className="font-display text-2xl">{item.title}</h3>
                <p className="mt-2 text-sm text-muted">
                  {startsAt ? formatEventSchedule({ startsAt, endsAt: String(item.payload.endsAt || "") || undefined }) : "Date not set"}
                </p>
                <p className="mt-1 text-sm text-muted">{String(item.payload.location || "Congo, Kawangware")}</p>
                <WorkflowBar type="events" id={item.id} status={item.status} onChanged={refresh} />
                <div className="admin-piece-actions">
                  <Link className="btn btn-ghost" href={adminEditPath("events", item.id)}>
                    Edit this event
                  </Link>
                  <button className="btn btn-ghost" type="button" onClick={() => remove(item.id, item.title)}>
                    Remove
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="text-muted">None yet.</p>
          )}
        </div>
      </section>
    );
  }

  return (
    <div>
      <AdminHeader kicker="In the community" title="Events" previewHref="/events">
        <p>Dates are shown in Nairobi time, as they are on the public calendar.</p>
      </AdminHeader>
      {error ? <p className="admin-flash mt-4">{error}</p> : null}
      {message ? <p className="admin-flash mt-4">{message}</p> : null}
      <button className="btn btn-plum mt-6" type="button" onClick={() => setOpen((value) => !value)}>
        {open ? "Cancel" : "Add an event"}
      </button>
      {open ? (
        <form className="admin-form admin-form-wide mt-6" onSubmit={add}>
          <label>
            Event name
            <input name="title" required />
          </label>
          <label>
            Kind of day
            <select name="type" defaultValue="outreach">
              {Object.entries(eventTypeLabels).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Starts (Nairobi)
            <input name="startsAt" type="datetime-local" required defaultValue={datetimeLocalFromIso(new Date().toISOString())} />
          </label>
          <label>
            Ends (optional)
            <input name="endsAt" type="datetime-local" />
          </label>
          <label>
            Place
            <input name="location" defaultValue="Congo, Kawangware" />
          </label>
          <label className="admin-span-2">
            Short summary
            <textarea name="summary" rows={2} />
          </label>
          <label className="admin-span-2">
            What happens that day
            <textarea name="description" rows={4} />
          </label>
          <button className="btn btn-plum" type="submit">
            Save as draft
          </button>
        </form>
      ) : null}
      <Group title="Coming up" rows={upcoming} />
      <Group title="Past days" rows={past} />
    </div>
  );
}
