"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { WorkflowBar } from "@/components/admin/WorkflowBar";
import { useAdminList } from "@/components/admin/useAdminContent";
import { adminEditPath } from "@/lib/cms/admin-paths";
import { donationCategories } from "@/lib/data/donation";

export function ProgramBoard() {
  const { items, error, message, create, remove, refresh, setError } = useAdminList("programs");
  const [open, setOpen] = useState(false);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    try {
      await create({
        title: name,
        excerpt: String(form.get("summary") ?? ""),
        content: String(form.get("explanation") ?? ""),
        payload: {
          eyebrow: String(form.get("eyebrow") ?? "Programme"),
          donationCategory: String(form.get("donationCategory") ?? "General Support"),
          ctaLabel: "Support this work",
          ctaHref: "/donate",
          impact: "",
        },
      });
      event.currentTarget.reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that programme.");
    }
  }

  return (
    <div className="admin-stack">
      <AdminHeader
        kicker="How we empower"
        title="Programs"
        previewHref="/programs"
        actions={
          <button className="btn btn-plum" type="button" onClick={() => setOpen((value) => !value)}>
            {open ? "Cancel" : "Add a programme"}
          </button>
        }
      >
        <p>Each programme is a path on the public site — menstrual health, dignity kits, vocational training, and the rest of the work.</p>
      </AdminHeader>
      {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}
      {message ? <p className="admin-flash admin-flash--ok">{message}</p> : null}
      {open ? (
        <form className="admin-form" onSubmit={add}>
          <label>
            Programme name
            <input name="name" required />
          </label>
          <label>
            Eyebrow
            <input name="eyebrow" placeholder="Skill" />
          </label>
          <label>
            Giving category
            <select name="donationCategory" defaultValue="General Support">
              {donationCategories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Summary
            <textarea name="summary" rows={2} />
          </label>
          <label>
            Explanation
            <textarea name="explanation" rows={4} />
          </label>
          <button className="btn btn-plum" type="submit">
            Save as draft
          </button>
        </form>
      ) : null}
      <div className="admin-piece-grid">
        {items.length ? (
          items.map((item) => (
          <article key={item.id} className="admin-piece">
            <div className="admin-piece-top">
              <p className="eyebrow text-accent">{String(item.payload.eyebrow || "Programme")}</p>
              <StatusBadge status={item.status} />
            </div>
            <h3 className="font-display text-2xl">{item.title}</h3>
            <p className="mt-2 text-sm text-muted">{item.excerpt}</p>
            <WorkflowBar type="programs" id={item.id} status={item.status} onChanged={refresh} />
            <div className="admin-piece-actions">
              <Link className="btn btn-plum" href={adminEditPath("programs", item.id)}>
                Edit this programme
              </Link>
              <Link className="btn btn-ghost" href={`/programs/${item.slug}`} target="_blank" rel="noreferrer">
                Preview
              </Link>
              <button className="btn admin-danger" type="button" onClick={() => remove(item.id, item.title)}>
                Remove
              </button>
            </div>
          </article>
          ))
        ) : (
          <p className="admin-empty">No programmes yet. Add one to start a path on the public site.</p>
        )}
      </div>
    </div>
  );
}
