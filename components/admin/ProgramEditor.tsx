"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { WorkflowBar } from "@/components/admin/WorkflowBar";
import { adminFetch } from "@/components/admin/adminFetch";
import { useAdminItem, type AdminItem } from "@/components/admin/useAdminContent";
import { donationCategories } from "@/lib/data/donation";

export function ProgramEditor({ id }: { id: string }) {
  const { item, error, message, busy, save, refresh } = useAdminItem("programs", id);
  const [stories, setStories] = useState<AdminItem[]>([]);

  useEffect(() => {
    adminFetch("/api/v1/admin/content/stories")
      .then((data) => setStories((data.items as AdminItem[]) ?? []))
      .catch(() => undefined);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await save({
      title: form.get("name"),
      slug: form.get("slug"),
      excerpt: form.get("summary"),
      content: form.get("explanation"),
      featured_image: form.get("visual"),
      payload: {
        eyebrow: form.get("eyebrow"),
        impact: form.get("impact"),
        donationCategory: form.get("donationCategory"),
        ctaLabel: form.get("ctaLabel"),
        ctaHref: form.get("ctaHref"),
        relatedStorySlugs: form.getAll("relatedStorySlugs").map(String),
      },
    });
  }

  if (error) return <p className="admin-flash">{error}</p>;
  if (!item) return <p>Loading this programme…</p>;
  const payload = item.payload ?? {};
  const related = Array.isArray(payload.relatedStorySlugs)
    ? payload.relatedStorySlugs.filter((value): value is string => typeof value === "string")
    : [];

  return (
    <div>
      <p>
        <Link href="/admin/programs">Back to programmes</Link>
      </p>
      <AdminHeader kicker="Programme" title={item.title} previewHref={`/programs/${item.slug}`} />
      {message ? <p className="admin-flash mt-4">{message}</p> : null}
      <WorkflowBar type="programs" id={item.id} status={item.status} onChanged={refresh} />
      <form className="admin-form admin-form-wide mt-6" onSubmit={onSubmit}>
        <label>
          Programme name
          <input name="name" defaultValue={item.title} required />
        </label>
        <label>
          Address on the site
          <input name="slug" defaultValue={item.slug} required />
        </label>
        <label>
          Eyebrow
          <input name="eyebrow" defaultValue={String(payload.eyebrow ?? "")} />
        </label>
        <label>
          Giving category
          <select name="donationCategory" defaultValue={String(payload.donationCategory ?? "General Support")}>
            {donationCategories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-span-2">
          Summary
          <textarea name="summary" rows={2} defaultValue={item.excerpt} />
        </label>
        <label className="admin-span-2">
          Explanation
          <textarea name="explanation" rows={6} defaultValue={item.content} />
        </label>
        <label className="admin-span-2">
          Why this work matters
          <textarea name="impact" rows={3} defaultValue={String(payload.impact ?? "")} />
        </label>
        <label>
          Photograph
          <input name="visual" defaultValue={item.featuredImage} />
        </label>
        <label>
          Button label
          <input name="ctaLabel" defaultValue={String(payload.ctaLabel ?? "Support this work")} />
        </label>
        <label className="admin-span-2">
          Button goes to
          <input name="ctaHref" defaultValue={String(payload.ctaHref ?? "/donate")} />
        </label>
        <fieldset className="admin-span-2">
          <legend>Linked stories</legend>
          <div className="admin-check-list">
            {stories.map((story) => (
              <label key={story.slug} className="admin-check">
                <input
                  type="checkbox"
                  name="relatedStorySlugs"
                  value={story.slug}
                  defaultChecked={related.includes(story.slug)}
                />
                {story.title}
              </label>
            ))}
          </div>
        </fieldset>
        <button className="btn btn-plum" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save programme"}
        </button>
      </form>
    </div>
  );
}
