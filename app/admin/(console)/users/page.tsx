"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ROLE_LABELS, ASSIGNABLE_ROLE_SLUGS } from "@/lib/cms/permissions";

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
  const [notice, setNotice] = useState("");
  const [adding, setAdding] = useState(false);

  async function load() {
    const data = await adminFetch("/api/v1/admin/users");
    setItems((data.items as User[]) ?? []);
  }

  useEffect(() => {
    adminFetch("/api/v1/admin/users")
      .then((data) => setItems((data.items as User[]) ?? []))
      .catch((err: Error) => setError(err.message));
  }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Keep the form: React clears event.currentTarget once this handler awaits.
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    setAdding(true);
    setError("");
    setNotice("");
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
      formEl.reset();
      setNotice(
        `${String(form.get("name"))} can now sign in at /admin/login with ${String(form.get("email"))} and the temporary password you chose. Give them the password privately and ask them to change it under My account.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add this person.");
    } finally {
      setAdding(false);
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
          These are the people who can sign in to Admin. Roles control what they may change.
        </p>
      </AdminHeader>
      {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}
      {notice ? <p className="admin-flash admin-flash--ok">{notice}</p> : null}
      <section className="admin-group">
        <div className="admin-section-head">
          <h2 className="font-display">Add a person</h2>
        </div>
        <p className="text-sm text-muted">
          This creates their sign-in straight away. No email is sent: share the temporary password with them
          yourself, and they can change it under My account or with Forgot password.
        </p>
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
            {ASSIGNABLE_ROLE_SLUGS.map((slug) => (
              <option key={slug} value={slug}>
                {ROLE_LABELS[slug]}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-plum" type="submit" disabled={adding}>
          {adding ? "Adding…" : "Add person"}
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
          <p className="admin-empty">No people on this desk yet. Add someone above.</p>
        )}
      </div>
      </section>
    </div>
  );
}
