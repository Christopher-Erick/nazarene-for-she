"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CMS_ACTIONS } from "@/lib/cms/permissions";
import { GRANTABLE_ADMIN_PAGES, MATRIX_MODULES } from "@/lib/cms/nav";

type RoleInfo = { slug: string; name: string; description: string; builtIn: boolean; user_count: number };

export default function RolesPage() {
  const [role, setRole] = useState("admin");
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [matrix, setMatrix] = useState<Record<string, string[]>>({});
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function apply(data: Record<string, unknown>) {
    setMatrix((data.matrix as Record<string, string[]>) ?? {});
    setRoles((data.roles as RoleInfo[]) ?? []);
  }

  async function load() {
    apply(await adminFetch("/api/v1/admin/roles"));
  }

  useEffect(() => {
    adminFetch("/api/v1/admin/roles")
      .then(apply)
      .catch((err: Error) => setError(err.message));
  }, []);

  const current = roles.find((item) => item.slug === role);
  const roleName = current?.name ?? role;

  async function createRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    setError("");
    setMessage("");
    setCreating(true);
    try {
      const data = await adminFetch("/api/v1/admin/roles", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          description: form.get("description"),
          copyFrom: form.get("copyFrom"),
        }),
      });
      const created = data.role as RoleInfo;
      formEl.reset();
      await load();
      setRole(created.slug);
      setMessage(
        `${created.name} created. Tick what they may do below, then save. You can now give it to people under People.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the role.");
    } finally {
      setCreating(false);
    }
  }

  async function renameRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setMessage("");
    try {
      await adminFetch("/api/v1/admin/roles", {
        method: "PATCH",
        body: JSON.stringify({ role, name: form.get("name"), description: form.get("description") }),
      });
      setRenaming(false);
      await load();
      setMessage("Role details saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the role.");
    }
  }

  async function deleteRole() {
    if (!current || current.builtIn) return;
    if (!confirm(`Delete the ${current.name} role? This cannot be undone.`)) return;
    setError("");
    setMessage("");
    try {
      await adminFetch(`/api/v1/admin/roles?role=${encodeURIComponent(current.slug)}`, { method: "DELETE" });
      setRole("admin");
      await load();
      setMessage(`${current.name} deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the role.");
    }
  }

  function checked(module: string, action: string) {
    return (matrix[role] ?? []).includes(`${module}.${action}`);
  }

  function toggle(module: string, action: string) {
    const key = `${module}.${action}`;
    const current = new Set(matrix[role] ?? []);
    if (current.has(key)) current.delete(key);
    else current.add(key);
    setMatrix({ ...matrix, [role]: [...current] });
  }

  async function save() {
    setError("");
    try {
      await adminFetch("/api/v1/admin/roles", {
        method: "PUT",
        body: JSON.stringify({ role, permissions: matrix[role] ?? [] }),
      });
      setMessage("Permissions saved. They apply on the next request.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    }
  }

  return (
    <div className="admin-stack">
      <AdminHeader kicker="Access" title="Roles & permissions">
        <p>
          Super Admin decides which admin pages each role can see. Untick <strong>Show</strong> to
          hide that desk from their menu, from Today, and if they type the address. Today and My
          account always stay. Roles & access and Maintenance stay Super Admin only.
        </p>
      </AdminHeader>
      {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}
      {message ? <p className="admin-flash admin-flash--ok">{message}</p> : null}
      <details className="admin-form">
        <summary className="admin-form-title font-display">Create a role</summary>
        <form className="admin-stack mt-3" onSubmit={createRole}>
          <label>
            Role name
            <input name="name" required minLength={2} maxLength={60} placeholder="e.g. Youth Coordinator" />
          </label>
          <label>
            What this role is for (optional)
            <input name="description" maxLength={240} placeholder="e.g. Runs mentorship sessions and events" />
          </label>
          <label>
            Start with the permissions of
            <select name="copyFrom" defaultValue="">
              <option value="">Nothing: I will tick them myself</option>
              {roles
                .filter((item) => item.slug !== "super_admin")
                .map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))}
            </select>
          </label>
          <button className="btn btn-plum" type="submit" disabled={creating}>
            {creating ? "Creating…" : "Create role"}
          </button>
        </form>
      </details>

      <div className="admin-form">
        <label>
          Role
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setRenaming(false);
            }}
          >
            {roles.map((item) => (
              <option key={item.slug} value={item.slug}>
                {`${item.name}${item.builtIn ? "" : " (custom)"} · ${item.user_count} ${item.user_count === 1 ? "person" : "people"}`}
              </option>
            ))}
          </select>
        </label>
        {current?.description ? <p className="admin-help">{current.description}</p> : null}
        {current && !current.builtIn ? (
          renaming ? (
            <form className="admin-stack" onSubmit={renameRole}>
              <label>
                Role name
                <input name="name" defaultValue={current.name} required minLength={2} maxLength={60} />
              </label>
              <label>
                What this role is for
                <input name="description" defaultValue={current.description} maxLength={240} />
              </label>
              <div className="admin-piece-actions">
                <button className="btn btn-plum" type="submit">
                  Save role details
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => setRenaming(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="admin-piece-actions">
              <button className="btn btn-ghost" type="button" onClick={() => setRenaming(true)}>
                Rename
              </button>
              <button
                className="btn admin-danger"
                type="button"
                onClick={deleteRole}
                disabled={current.user_count > 0}
              >
                Delete role
              </button>
              {current.user_count > 0 ? (
                <span className="admin-help">
                  To delete it, first give its {current.user_count} {current.user_count === 1 ? "person" : "people"}{" "}
                  another role under People.
                </span>
              ) : null}
            </div>
          )
        ) : null}
        {role === "super_admin" ? (
          <p className="admin-note">Super Admin always has every permission. Those boxes cannot be turned off.</p>
        ) : (
          <p className="text-sm text-muted">
            Tick the pages this role may open, then the actions they may take. Document pages start
            empty — grant view here or they will not see Documents at all.
          </p>
        )}
      </div>

      {role !== "super_admin" ? (
        <section className="admin-group">
          <div className="admin-section-head">
            <h2 className="font-display">Pages they can open</h2>
          </div>
          <p className="admin-help">
            These are the /admin desks. A closed box means that page is hidden from this role.
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Show</th>
                </tr>
              </thead>
              <tbody>
                {GRANTABLE_ADMIN_PAGES.map((page) => (
                    <tr key={page.href}>
                      <td>
                        {page.label}
                        <p className="admin-help">{page.href}</p>
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={checked(page.module, "view")}
                          onChange={() => toggle(page.module, "view")}
                          aria-label={`Show ${page.label}`}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      <div className="admin-table-wrap">
        <table className="admin-matrix">
          <thead>
            <tr>
              <th>Module</th>
              {CMS_ACTIONS.map((action) => (
                <th key={action}>{action}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX_MODULES.map((module) => (
              <tr key={module}>
                <td>{module}</td>
                {CMS_ACTIONS.map((action) => (
                  <td key={action}>
                    <input
                      type="checkbox"
                      checked={checked(module, action)}
                      onChange={() => toggle(module, action)}
                      disabled={role === "super_admin"}
                      aria-label={`${module} ${action}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="admin-toolbar">
        <button className="btn btn-plum" type="button" onClick={save} disabled={role === "super_admin"}>
          Save {roleName}
        </button>
      </div>
    </div>
  );
}
