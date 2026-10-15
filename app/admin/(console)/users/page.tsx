"use client";

import Link from "next/link";
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
  self?: boolean;
};

export default function UsersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [adding, setAdding] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [viewerIsSuperAdmin, setViewerIsSuperAdmin] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  function applyList(data: Record<string, unknown>) {
    setItems((data.items as User[]) ?? []);
    setViewerIsSuperAdmin(data.viewerIsSuperAdmin === true);
  }

  async function load() {
    applyList(await adminFetch("/api/v1/admin/users"));
  }

  useEffect(() => {
    adminFetch("/api/v1/admin/users")
      .then(applyList)
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

  async function saveProfile(user: User, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setNotice("");
    setSavingProfile(true);
    const patch: Record<string, string> = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
    };
    if (!user.self) patch.role = String(form.get("role") ?? user.role);
    try {
      await adminFetch("/api/v1/admin/users", {
        method: "PATCH",
        body: JSON.stringify({ id: user.id, ...patch }),
      });
      setEditingId(null);
      setNotice(`${patch.name}'s profile has been saved.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function setPassword(user: User, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const password = String(form.get("password") ?? "");
    setError("");
    setNotice("");
    if (password !== String(form.get("confirm") ?? "")) {
      setError("The two passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      await adminFetch("/api/v1/admin/users", {
        method: "PATCH",
        body: JSON.stringify({ id: user.id, password }),
      });
      formEl.reset();
      setResettingId(null);
      setNotice(
        `${user.name}'s password has been changed and they have been signed out everywhere. Give them the new password privately; they can change it under My account.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change the password.");
    } finally {
      setSavingPassword(false);
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
              {viewerIsSuperAdmin ? (
              <button
                className="btn btn-ghost"
                type="button"
                aria-expanded={editingId === user.id}
                onClick={() => {
                  setResettingId(null);
                  setEditingId(editingId === user.id ? null : user.id);
                }}
              >
                {editingId === user.id ? "Cancel edit" : "Edit"}
              </button>
              ) : null}
              {user.self ? (
                <Link className="btn btn-ghost" href="/admin/account">
                  Change my password
                </Link>
              ) : viewerIsSuperAdmin ? (
                <button
                  className="btn btn-ghost"
                  type="button"
                  aria-expanded={resettingId === user.id}
                  onClick={() => {
                    setEditingId(null);
                    setResettingId(resettingId === user.id ? null : user.id);
                  }}
                >
                  {resettingId === user.id ? "Cancel" : "Set new password"}
                </button>
              ) : null}
            </div>
            {editingId === user.id ? (
              <form className="admin-form mt-4" onSubmit={(event) => saveProfile(user, event)}>
                <label>
                  Name
                  <input name="name" defaultValue={user.name} required maxLength={120} />
                </label>
                <label>
                  Email (used to sign in)
                  <input name="email" type="email" defaultValue={user.email} required />
                </label>
                {!user.self ? (
                  <label>
                    Role
                    <select name="role" defaultValue={user.role}>
                      {(user.role === "super_admin" ? ["super_admin", ...ASSIGNABLE_ROLE_SLUGS] : ASSIGNABLE_ROLE_SLUGS).map(
                        (slug) => (
                          <option key={slug} value={slug}>
                            {ROLE_LABELS[slug as keyof typeof ROLE_LABELS]}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                ) : null}
                <p className="text-sm text-muted">
                  A new email must be verified in Cloudflare Email Routing before reset emails can reach it.
                </p>
                <button className="btn btn-plum" type="submit" disabled={savingProfile}>
                  {savingProfile ? "Saving…" : "Save profile"}
                </button>
              </form>
            ) : null}
            {resettingId === user.id ? (
              <form className="admin-form mt-4" onSubmit={(event) => setPassword(user, event)}>
                <label>
                  New password for {user.name}
                  <input name="password" type="password" autoComplete="new-password" required minLength={14} maxLength={128} />
                </label>
                <label>
                  Type it again
                  <input name="confirm" type="password" autoComplete="new-password" required minLength={14} maxLength={128} />
                </label>
                <p className="text-sm text-muted">
                  At least 14 characters with upper and lower case, a number and a symbol. They will be signed out
                  everywhere.
                </p>
                <button className="btn btn-plum" type="submit" disabled={savingPassword}>
                  {savingPassword ? "Saving…" : "Save new password"}
                </button>
              </form>
            ) : null}
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
