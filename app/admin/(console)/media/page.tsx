"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import { AdminHeader } from "@/components/admin/AdminHeader";

type MediaItem = {
  id: string;
  title: string;
  public_url: string;
  mime_type: string;
  created_at: number;
};

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const data = await adminFetch("/api/v1/admin/media");
    setItems((data.items as MediaItem[]) ?? []);
  }

  useEffect(() => {
    adminFetch("/api/v1/admin/media")
      .then((data) => setItems((data.items as MediaItem[]) ?? []))
      .catch((err: Error) => setError(err.message));
  }, []);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await adminFetch("/api/v1/admin/media", { method: "POST", body: new FormData(form) });
      form.reset();
      setMessage("Upload stored.");
      setError("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this media item from the library?")) return;
    try {
      await adminFetch(`/api/v1/admin/media?id=${id}`, { method: "DELETE" });
      setMessage("Removed from the library.");
      setError("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
    }
  }

  return (
    <div className="admin-stack">
      <AdminHeader kicker="Library" title="Photographs">
        <p>
          Workshop and atmosphere images. Use them on pieces, programmes, events and stories. Alt
          text is required for anything that might appear on the public site.
        </p>
      </AdminHeader>
      {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}
      {message ? <p className="admin-flash admin-flash--ok">{message}</p> : null}
      <form className="admin-form" onSubmit={upload}>
        <label>
          File
          <input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" required />
        </label>
        <label>
          Title
          <input name="title" />
        </label>
        <label>
          Alt text
          <input name="alt" />
        </label>
        <button className="btn btn-plum" type="submit">
          Upload
        </button>
      </form>
      {items.length ? (
        <div className="admin-media-grid">
          {items.map((item) => (
            <article key={item.id} className="admin-piece admin-media-card">
              {item.public_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.public_url} alt={item.title} />
              ) : null}
              <h3 className="mt-3 font-display text-xl">{item.title || "Untitled"}</h3>
              <p className="mt-1 text-sm text-muted break-all">{item.public_url}</p>
              <div className="admin-piece-actions">
                <button className="btn admin-danger" type="button" onClick={() => remove(item.id)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="admin-empty">No photographs in the library yet.</p>
      )}
    </div>
  );
}
