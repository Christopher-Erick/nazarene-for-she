"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";

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
    load().catch((err: Error) => setError(err.message));
  }, []);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await adminFetch("/api/v1/admin/media", { method: "POST", body: new FormData(form) });
      form.reset();
      setMessage("Upload stored.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this media item from the library?")) return;
    try {
      await adminFetch(`/api/v1/admin/media?id=${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
    }
  }

  return (
    <div>
      <h1 className="font-display text-4xl">Photographs</h1>
      <p className="mt-2 text-muted">
        Workshop and atmosphere images. Use them on pieces, programmes, events and stories. Alt text
        is required for anything that might appear on the public site.
      </p>
      {error ? <p className="admin-flash mt-4">{error}</p> : null}
      {message ? <p className="admin-flash mt-4">{message}</p> : null}
      <form className="admin-form mt-8" onSubmit={upload}>
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
      <div className="admin-media-grid mt-8">
        {items.map((item) => (
          <article key={item.id} className="admin-piece admin-media-card">
            {item.public_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.public_url} alt={item.title} />
            ) : null}
            <h3 className="mt-3 font-display text-xl">{item.title || "Untitled"}</h3>
            <p className="mt-1 text-sm text-muted break-all">{item.public_url}</p>
            <button className="btn btn-ghost mt-3" type="button" onClick={() => remove(item.id)}>
              Remove
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
