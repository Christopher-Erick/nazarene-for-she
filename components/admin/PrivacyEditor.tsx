"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import { AdminHeader } from "@/components/admin/AdminHeader";

export function PrivacyEditor() {
  const [title, setTitle] = useState("We collect only what we need to walk with you.");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    adminFetch("/api/v1/admin/settings")
      .then((data) => {
        const stored = ((data.settings as Record<string, unknown>)?.privacy_policy ?? {}) as {
          title?: string;
          body?: string;
        };
        if (stored.title) setTitle(stored.title);
        if (stored.body) setBody(stored.body);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    try {
      await adminFetch("/api/v1/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ key: "privacy_policy", value: { title, body } }),
      });
      setMessage("Saved. An empty body keeps the default privacy copy on the public page.");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    }
  }

  return (
    <div className="admin-stack">
      <AdminHeader kicker="Public website" title="Privacy" previewHref="/privacy">
        <p>If the body is empty, visitors still see the careful default policy already on the site.</p>
      </AdminHeader>
      {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}
      {message ? <p className="admin-flash admin-flash--ok">{message}</p> : null}
      <form className="admin-form" onSubmit={save}>
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Policy body
          <textarea rows={16} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button className="btn btn-plum" type="submit">
          Save privacy policy
        </button>
      </form>
    </div>
  );
}
