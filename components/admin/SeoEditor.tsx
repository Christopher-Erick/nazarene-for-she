"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import { AdminHeader } from "@/components/admin/AdminHeader";

export function SeoEditor() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    adminFetch("/api/v1/admin/settings")
      .then((data) => {
        const stored = ((data.settings as Record<string, unknown>)?.seo_defaults ?? {}) as {
          title?: string;
          description?: string;
        };
        setTitle(stored.title ?? "");
        setDescription(stored.description ?? "");
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    try {
      await adminFetch("/api/v1/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ key: "seo_defaults", value: { title, description } }),
      });
      setMessage("Saved. Individual pages can still set their own search titles.");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    }
  }

  return (
    <div className="admin-stack">
      <AdminHeader kicker="Search" title="SEO defaults">
        <p>Used when a page does not set its own title or description for search engines.</p>
      </AdminHeader>
      {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}
      {message ? <p className="admin-flash admin-flash--ok">{message}</p> : null}
      <form className="admin-form" onSubmit={save}>
        <label>
          Default title
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Default description
          <textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <button className="btn btn-plum" type="submit">
          Save search defaults
        </button>
      </form>
    </div>
  );
}
