"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ROLE_LABELS, ROLE_SLUGS } from "@/lib/cms/permissions";

type User = {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
  roleName: string;
};

export default function UsersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const data = await adminFetch("/api/v1/admin/users");
    setItems((data.items as User[]) ?? []);
  }

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await adminFetch("/api/v1/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          role: form.get("role"),
        }),
      });
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create user.");
    }
  }

  async function update(user: User, patch: Record<string, string>) {
    try {
      await adminFetch("/api/v1/admin/users", {
        method: "PATCH",
        body: JSON.stringify({ id: user.id, ...patch }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update user.");
    }
  }

  return (
    <div className="admin-stack">
      <AdminHeader kicker="Access" title="People">
        <p>
          These are the people who can sign in to Admin. Roles control what they may change. Only a
          Super Admin can open Roles & access.
        </p>
      </AdminHeader>
      {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}
      <section className="admin-group">
        <div className="admin-section-head">
          <h2 className="font-display">Invite</h2>
        </div>
        <form className="admin-form" onSubmit={create}>
        <label>
          Name
          <input name="name" required />
        </label>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Temporary password
          <input name="password" type="password" required minLength={14} />
        </label>
        <label>
          Role
          <select name="role" defaultValue="member">
            {ROLE_SLUGS.filter((slug) => slug !== "super_admin").map((slug) => (
              <option key={slug} value={slug}>
                {ROLE_LABELS[slug]}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-plum" type="submit">
          Invite to Admin
        </button>
      </form>
      </section>
      <section className="admin-group">
        <div className="admin-section-head">
          <h2 className="font-display">On this desk</h2>
        </div>
      <div className="admin-piece-grid">
        {items.length ? (
          items.map((user) => (
          <article key={user.id} className="admin-piece">
            <div className="admin-piece-top">
              <p className="eyebrow text-accent">{user.roleName}</p>
              <span className={`admin-status ${user.status === "active" ? "is-live" : "is-off"}`}>
                {user.status === "active" ? "Can sign in" : "Access paused"}
              </span>
            </div>
            <h3 className="font-display text-2xl">{user.name}</h3>
            <p className="mt-1 text-sm text-muted">{user.email}</p>
            <div className="admin-piece-actions">
              <button
                className={`btn ${user.status === "active" ? "admin-danger" : "btn-plum"}`}
                type="button"
                onClick={() =>
                  update(user, { status: user.status === "active" ? "disabled" : "active" })
                }
              >
                {user.status === "active" ? "Pause access" : "Allow sign-in again"}
              </button>
            </div>
          </article>
          ))
        ) : (
          <p className="admin-empty">No people on this desk yet. Invite someone above.</p>
        )}
      </div>
      </section>
    </div>
  );
}
