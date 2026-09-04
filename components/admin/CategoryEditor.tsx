"use client";

import { FormEvent } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { WorkflowBar } from "@/components/admin/WorkflowBar";
import { useAdminItem } from "@/components/admin/useAdminContent";
import { workshopStills, type StillId } from "@/lib/data/shop";

export function CategoryEditor({ id }: { id: string }) {
  const { item, error, message, busy, save, refresh } = useAdminItem("atelier", id);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await save({
      title: form.get("title"),
      slug: form.get("slug"),
      excerpt: form.get("summary"),
      content: form.get("explanation"),
      featured_image: form.get("featured_image"),
      seo_title: form.get("seo_title"),
      seo_description: form.get("seo_description"),
      payload: {
        eyebrow: form.get("eyebrow"),
        verb: form.get("verb"),
        lure: form.get("lure"),
        sizing: form.get("sizing"),
        still: form.get("still"),
        sortOrder: Number(form.get("sortOrder") ?? 0),
      },
    });
  }

  if (error) return <p className="admin-flash">{error}</p>;
  if (!item) return <p>Loading this category…</p>;
  const payload = item.payload ?? {};

  return (
    <div>
      <p>
        <Link href="/admin/shop">Back to the shop</Link>
      </p>
      <AdminHeader kicker="Shop category" title={item.title} previewHref={`/shop/${item.slug}`}>
        <p>
          This is a filter on the public rack — Dresses, Skirts, Totes, and so on. Pieces you add
          later live inside this category.
        </p>
      </AdminHeader>
      {message ? <p className="admin-flash mt-4">{message}</p> : null}
      <WorkflowBar type="atelier" id={item.id} status={item.status} onChanged={refresh} />
      <form className="admin-form admin-form-wide mt-6" onSubmit={onSubmit}>
        <label>
          Category name
          <input name="title" defaultValue={item.title} required />
        </label>
        <label>
          Address on the site
          <input name="slug" defaultValue={item.slug} required />
        </label>
        <label>
          Default sizing for new pieces
          <select name="sizing" defaultValue={String(payload.sizing ?? "body")}>
            <option value="body">Body sizes (S, M, L, custom)</option>
            <option value="one">One size (and custom)</option>
          </select>
        </label>
        <label>
          Eyebrow
          <input name="eyebrow" defaultValue={String(payload.eyebrow ?? "From the workshop")} />
        </label>
        <label>
          Verb
          <input name="verb" defaultValue={String(payload.verb ?? "")} />
        </label>
        <label className="admin-span-2">
          Lure
          <textarea name="lure" rows={2} defaultValue={String(payload.lure ?? "")} />
        </label>
        <label className="admin-span-2">
          Summary
          <textarea name="summary" rows={2} defaultValue={item.excerpt} />
        </label>
        <label className="admin-span-2">
          Category page copy
          <textarea name="explanation" rows={6} defaultValue={item.content} />
        </label>
        <label>
          Workshop photograph
          <select name="still" defaultValue={String(payload.still ?? "atelier")}>
            {(Object.keys(workshopStills) as StillId[]).map((stillId) => (
              <option key={stillId} value={stillId}>
                {stillId === "fabric" ? "Wax-print cloth" : stillId === "thread" ? "Thread and table" : "Workshop table"}
              </option>
            ))}
          </select>
        </label>
        <label>
          Order on the rack
          <input name="sortOrder" type="number" min={0} max={999} defaultValue={Number(payload.sortOrder ?? 0)} />
        </label>
        <label className="admin-span-2">
          Custom photograph (optional)
          <input
            name="featured_image"
            defaultValue={item.featuredImage}
            placeholder="/images/atmosphere-atelier.webp or a Media library URL"
          />
        </label>
        <label>
          Search title
          <input name="seo_title" defaultValue={item.seo?.title ?? ""} />
        </label>
        <label>
          Search description
          <textarea name="seo_description" rows={2} defaultValue={item.seo?.description ?? ""} />
        </label>
        <button className="btn btn-plum" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save category"}
        </button>
      </form>
    </div>
  );
}
