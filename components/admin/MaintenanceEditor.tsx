"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { datetimeLocalFromIso, isoFromDatetimeLocal } from "@/lib/cms/shapes";

type Maintenance = {
  enabled: boolean;
  status: "scheduled" | "active" | "completed";
  title: string;
  message: string;
  estimatedReturnAt: number | null;
  contact: string;
};

export function MaintenanceEditor() {
  const [state, setState] = useState<Maintenance | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    adminFetch("/api/v1/admin/maintenance")
      .then((data) => setState(data.maintenance as Maintenance))
      .catch((err: Error) => setError(err.message));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!state) return;
    const form = new FormData(event.currentTarget);
    const returnIso = isoFromDatetimeLocal(String(form.get("estimatedReturnAt") ?? ""));
    try {
      const data = await adminFetch("/api/v1/admin/maintenance", {
        method: "PUT",
        body: JSON.stringify({
          enabled: form.get("enabled") === "on",
          status: form.get("status"),
          title: form.get("title"),
          message: form.get("message"),
          contact: form.get("contact"),
          estimatedReturnAt: returnIso ? new Date(returnIso).getTime() : null,
        }),
      });
      setState(data.maintenance as Maintenance);
      setMessage("Saved. Visitors only see maintenance when it is switched on.");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    }
  }

  if (error) return <p className="admin-flash">{error}</p>;
  if (!state) return <p>Loading maintenance…</p>;

  return (
    <form className="admin-form" onSubmit={save}>
      <AdminHeader kicker="Super Admin" title="Maintenance">
        <p>
          When this is on, visitors see a short message instead of the public site. People with Admin
          access can still sign in.
        </p>
      </AdminHeader>
      {message ? <p className="admin-flash mt-4">{message}</p> : null}
      <label className="admin-check">
        <input name="enabled" type="checkbox" defaultChecked={state.enabled} />
        Show the maintenance page to visitors
      </label>
      <label>
        Status
        <select name="status" defaultValue={state.status}>
          <option value="scheduled">Scheduled</option>
          <option value="active">Active now</option>
          <option value="completed">Completed</option>
        </select>
      </label>
      <label>
        Heading visitors see
        <input name="title" defaultValue={state.title} />
      </label>
      <label>
        Message
        <textarea name="message" rows={4} defaultValue={state.message} />
      </label>
      <label>
        Expected return (Nairobi, optional)
        <input
          name="estimatedReturnAt"
          type="datetime-local"
          defaultValue={state.estimatedReturnAt ? datetimeLocalFromIso(new Date(state.estimatedReturnAt).toISOString()) : ""}
        />
      </label>
      <label>
        Contact line
        <input name="contact" defaultValue={state.contact} />
      </label>
      <button className="btn btn-plum" type="submit">
        Save maintenance
      </button>
    </form>
  );
}
