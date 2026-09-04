"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { WorkflowBar } from "@/components/admin/WorkflowBar";
import { useAdminList } from "@/components/admin/useAdminContent";
import { adminEditPath } from "@/lib/cms/admin-paths";

export function StoryBoard() {
  const { items, error, message, create, remove, refresh, setError } = useAdminList("stories");
  const [open, setOpen] = useState(false);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await create({
        title: String(form.get("firstName") ?? ""),
        excerpt: String(form.get("challenge") ?? ""),
        content: String(form.get("experience") ?? ""),
        payload: {
          storyStatus: "placeholder",
          firstName: String(form.get("firstName") ?? ""),
          community: String(form.get("community") ?? "To be confirmed with consent"),
          challenge: String(form.get("challenge") ?? ""),
          transformation: "",
          aspiration: "",
        },
      });
      event.currentTarget.reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that story.");
    }
  }

  return (
    <div className="admin-stack">
      <AdminHeader
        kicker="Her voice"
        title="Stories"
        previewHref="/stories"
        actions={
          <button className="btn btn-plum" type="button" onClick={() => setOpen((value) => !value)}>
            {open ? "Cancel" : "Add a story"}
          </button>
        }
      >
        <p>
          Real stories go live only with consent. Keep a piece marked as a placeholder until she has
          agreed — visitors will see that clearly.
        </p>
      </AdminHeader>
      {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}
      {message ? <p className="admin-flash admin-flash--ok">{message}</p> : null}
      {open ? (
        <form className="admin-form" onSubmit={add}>
          <label>
            How she is named
            <input name="firstName" required placeholder="Her story — forthcoming" />
          </label>
          <label>
            Community
            <input name="community" defaultValue="To be confirmed with consent" />
          </label>
          <label>
            Challenge (her words, when ready)
            <textarea name="challenge" rows={3} />
          </label>
          <label>
            Experience with the work
            <textarea name="experience" rows={3} />
          </label>
          <button className="btn btn-plum" type="submit">
            Save as draft
          </button>
        </form>
      ) : null}
      <div className="admin-piece-grid">
        {items.length ? (
          items.map((item) => {
          const pending = item.payload.storyStatus === "placeholder";
          return (
            <article key={item.id} className="admin-piece">
              <div className="admin-piece-top">
                <p className="eyebrow text-accent">{pending ? "Consent pending" : "Consented story"}</p>
                <StatusBadge status={item.status} />
              </div>
              <h3 className="font-display text-2xl">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">{String(item.payload.community || "")}</p>
              <WorkflowBar type="stories" id={item.id} status={item.status} onChanged={refresh} />
              <div className="admin-piece-actions">
                <Link className="btn btn-plum" href={adminEditPath("stories", item.id)}>
                  Edit this story
                </Link>
                <button className="btn admin-danger" type="button" onClick={() => remove(item.id, item.title)}>
                  Remove
                </button>
              </div>
            </article>
          );
          })
        ) : (
          <p className="admin-empty">No stories yet. Add a placeholder until consent is given.</p>
        )}
      </div>
    </div>
  );
}
