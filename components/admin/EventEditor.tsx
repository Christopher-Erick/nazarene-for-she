"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { WorkflowBar } from "@/components/admin/WorkflowBar";
import { adminFetch } from "@/components/admin/adminFetch";
import { useAdminItem, type AdminItem } from "@/components/admin/useAdminContent";
import { datetimeLocalFromIso, isoFromDatetimeLocal } from "@/lib/cms/shapes";
import { eventTypeLabels } from "@/lib/data/events";

export function EventEditor({ id }: { id: string }) {
  const { item, error, message, busy, save, refresh } = useAdminItem("events", id);
  const [programs, setPrograms] = useState<AdminItem[]>([]);

  useEffect(() => {
    adminFetch("/api/v1/admin/content/programs")
      .then((data) => setPrograms((data.items as AdminItem[]) ?? []))
      .catch(() => undefined);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await save({
      title: form.get("title"),
      slug: form.get("slug"),
      excerpt: form.get("summary"),
      content: form.get("description"),
      featured_image: form.get("visual"),
      payload: {
        type: form.get("type"),
        startsAt: isoFromDatetimeLocal(String(form.get("startsAt") ?? "")),
        endsAt: isoFromDatetimeLocal(String(form.get("endsAt") ?? "")),
        location: form.get("location"),
        locationDetail: form.get("locationDetail"),
        relatedProgramSlug: form.get("relatedProgramSlug"),
        ctaLabel: form.get("ctaLabel"),
        ctaHref: form.get("ctaHref"),
        featured: form.get("featured") === "on",
      },
    });
  }

  if (error) return <p className="admin-flash admin-flash--error">{error}</p>;
  if (!item) return <p className="admin-loading">Loading this event…</p>;
  const payload = item.payload ?? {};

  return (
    <div className="admin-stack">
      <Link className="admin-back" href="/admin/events">
        ← Back to events
      </Link>
      <AdminHeader kicker="Event" title={item.title} previewHref={`/events/${item.slug}`} />
      {message ? <p className="admin-flash admin-flash--ok">{message}</p> : null}
      <div className="admin-editor">
        <WorkflowBar type="events" id={item.id} status={item.status} onChanged={refresh} />
        <form className="admin-form admin-form-wide" onSubmit={onSubmit}>
        <label>
          Event name
          <input name="title" defaultValue={item.title} required />
        </label>
        <label>
          Address on the site
          <input name="slug" defaultValue={item.slug} required />
        </label>
        <label>
          Kind of day
          <select name="type" defaultValue={String(payload.type ?? "outreach")}>
            {Object.entries(eventTypeLabels).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-check">
          <input name="featured" type="checkbox" defaultChecked={payload.featured === true} />
          Feature on Get Involved
        </label>
        <label>
          Starts (Nairobi)
          <input name="startsAt" type="datetime-local" defaultValue={datetimeLocalFromIso(String(payload.startsAt ?? ""))} required />
        </label>
        <label>
          Ends (optional)
          <input name="endsAt" type="datetime-local" defaultValue={datetimeLocalFromIso(String(payload.endsAt ?? ""))} />
        </label>
        <label>
          Place
          <input name="location" defaultValue={String(payload.location ?? "Congo, Kawangware")} />
        </label>
        <label>
          Place detail
          <input name="locationDetail" defaultValue={String(payload.locationDetail ?? "")} />
        </label>
        <label className="admin-span-2">
          Short summary
          <textarea name="summary" rows={2} defaultValue={item.excerpt} />
        </label>
        <label className="admin-span-2">
          What happens that day
          <textarea name="description" rows={6} defaultValue={item.content} />
        </label>
        <label>
          Linked programme
          <select name="relatedProgramSlug" defaultValue={String(payload.relatedProgramSlug ?? "")}>
            <option value="">None</option>
            {programs.map((program) => (
              <option key={program.slug} value={program.slug}>
                {program.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Photograph
          <input name="visual" defaultValue={item.featuredImage} />
        </label>
        <label>
          Button label
          <input name="ctaLabel" defaultValue={String(payload.ctaLabel ?? "")} />
        </label>
        <label>
          Button goes to
          <input name="ctaHref" defaultValue={String(payload.ctaHref ?? "")} />
        </label>
        <button className="btn btn-plum" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save event"}
        </button>
      </form>
      </div>
    </div>
  );
}
