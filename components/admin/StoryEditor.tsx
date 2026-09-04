"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { WorkflowBar } from "@/components/admin/WorkflowBar";
import { adminFetch } from "@/components/admin/adminFetch";
import { useAdminItem, type AdminItem } from "@/components/admin/useAdminContent";

export function StoryEditor({ id }: { id: string }) {
  const { item, error, message, busy, save, refresh } = useAdminItem("stories", id);
  const [programs, setPrograms] = useState<AdminItem[]>([]);

  useEffect(() => {
    adminFetch("/api/v1/admin/content/programs")
      .then((data) => setPrograms((data.items as AdminItem[]) ?? []))
      .catch(() => undefined);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const related = form.getAll("relatedProgramSlugs").map(String);
    await save({
      title: form.get("firstName"),
      slug: form.get("slug"),
      excerpt: form.get("challenge"),
      content: form.get("experience"),
      featured_image: form.get("portrait"),
      payload: {
        storyStatus: form.get("storyStatus"),
        firstName: form.get("firstName"),
        community: form.get("community"),
        portraitAlt: form.get("portraitAlt"),
        transformation: form.get("transformation"),
        aspiration: form.get("aspiration"),
        relatedProgramSlugs: related,
      },
    });
  }

  if (error) return <p className="admin-flash admin-flash--error">{error}</p>;
  if (!item) return <p className="admin-loading">Loading this story…</p>;
  const payload = item.payload ?? {};
  const related = Array.isArray(payload.relatedProgramSlugs)
    ? payload.relatedProgramSlugs.filter((value): value is string => typeof value === "string")
    : [];

  return (
    <div className="admin-stack">
      <Link className="admin-back" href="/admin/stories">
        ← Back to stories
      </Link>
      <AdminHeader kicker="Story" title={item.title} previewHref={`/stories/${item.slug}`}>
        <p>Do not publish a real name or portrait without explicit consent.</p>
      </AdminHeader>
      {message ? <p className="admin-flash admin-flash--ok">{message}</p> : null}
      <div className="admin-editor">
        <WorkflowBar type="stories" id={item.id} status={item.status} onChanged={refresh} />
        <form className="admin-form admin-form-wide" onSubmit={onSubmit}>
        <label>
          How she is named
          <input name="firstName" defaultValue={String(payload.firstName || item.title)} required />
        </label>
        <label>
          Address on the site
          <input name="slug" defaultValue={item.slug} required />
        </label>
        <label>
          Consent
          <select name="storyStatus" defaultValue={String(payload.storyStatus ?? "placeholder")}>
            <option value="placeholder">Placeholder — consent not yet given</option>
            <option value="published">Consented — this is her story</option>
          </select>
        </label>
        <label>
          Community
          <input name="community" defaultValue={String(payload.community ?? "")} />
        </label>
        <label className="admin-span-2">
          Challenge
          <textarea name="challenge" rows={4} defaultValue={item.excerpt} />
        </label>
        <label className="admin-span-2">
          Experience
          <textarea name="experience" rows={4} defaultValue={item.content} />
        </label>
        <label className="admin-span-2">
          Transformation
          <textarea name="transformation" rows={3} defaultValue={String(payload.transformation ?? "")} />
        </label>
        <label className="admin-span-2">
          Aspiration
          <textarea name="aspiration" rows={3} defaultValue={String(payload.aspiration ?? "")} />
        </label>
        <label>
          Portrait
          <input name="portrait" defaultValue={item.featuredImage} />
        </label>
        <label>
          Portrait description
          <input name="portraitAlt" defaultValue={String(payload.portraitAlt ?? "")} />
        </label>
        <fieldset className="admin-span-2">
          <legend>Linked programmes</legend>
          <div className="admin-check-list">
            {programs.map((program) => (
              <label key={program.slug} className="admin-check">
                <input
                  type="checkbox"
                  name="relatedProgramSlugs"
                  value={program.slug}
                  defaultChecked={related.includes(program.slug)}
                />
                {program.title}
              </label>
            ))}
          </div>
        </fieldset>
        <button className="btn btn-plum" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save story"}
        </button>
      </form>
      </div>
    </div>
  );
}
