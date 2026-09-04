"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";

type Stat = {
  id: string;
  label: string;
  value: string;
  status: string;
  note: string;
  sort_order: number;
  published: number;
};

export default function ImpactAdminPage() {
  const [items, setItems] = useState<Stat[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    adminFetch("/api/v1/admin/impact")
      .then((data) => setItems((data.items as Stat[]) ?? []))
      .catch((err: Error) => setError(err.message));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    try {
      await adminFetch("/api/v1/admin/impact", {
        method: "PUT",
        body: JSON.stringify({ items }),
      });
      setMessage("Impact statistics saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    }
  }

  return (
    <form onSubmit={save}>
      <h1 className="font-display text-4xl">Impact</h1>
      <p className="mt-2 text-muted">
        These figures appear on Impact. Keep a number off the public page until it is verified — we do
        not invent impact.
      </p>
      {error ? <p className="admin-flash mt-4">{error}</p> : null}
      {message ? <p className="admin-flash mt-4">{message}</p> : null}
      <div className="mt-6 space-y-4">
        {items.map((item, index) => (
          <article key={item.id} className="admin-card grid gap-3 md:grid-cols-2">
            <label>
              Label
              <input
                value={item.label}
                onChange={(event) => {
                  const next = [...items];
                  next[index] = { ...item, label: event.target.value };
                  setItems(next);
                }}
              />
            </label>
            <label>
              Value
              <input
                value={item.value}
                onChange={(event) => {
                  const next = [...items];
                  next[index] = { ...item, value: event.target.value };
                  setItems(next);
                }}
              />
            </label>
            <label>
              Status
              <select
                value={item.status}
                onChange={(event) => {
                  const next = [...items];
                  next[index] = { ...item, status: event.target.value };
                  setItems(next);
                }}
              >
                <option value="verified">Verified — safe to show</option>
                <option value="awaiting-verification">Awaiting verification</option>
              </select>
            </label>
            <label>
              Show on the Impact page
              <input
                type="checkbox"
                checked={Boolean(item.published)}
                onChange={(event) => {
                  const next = [...items];
                  next[index] = { ...item, published: event.target.checked ? 1 : 0 };
                  setItems(next);
                }}
              />
            </label>
          </article>
        ))}
      </div>
      <button className="btn btn-plum mt-6" type="submit">
        Save statistics
      </button>
    </form>
  );
}
