"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CMS_ACTIONS, ROLE_LABELS, ROLE_SLUGS, type RoleSlug } from "@/lib/cms/permissions";
import { GRANTABLE_ADMIN_PAGES, MATRIX_MODULES } from "@/lib/cms/nav";

export default function RolesPage() {
  const [role, setRole] = useState<RoleSlug>("admin");
  const [matrix, setMatrix] = useState<Record<string, string[]>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const data = await adminFetch("/api/v1/admin/roles");
    setMatrix((data.matrix as Record<string, string[]>) ?? {});
  }

  useEffect(() => {
    adminFetch("/api/v1/admin/roles")
      .then((data) => setMatrix((data.matrix as Record<string, string[]>) ?? {}))
      .catch((err: Error) => setError(err.message));
  }, []);

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
      <div className="admin-form">
        <label>
          Role
          <select value={role} onChange={(event) => setRole(event.target.value as RoleSlug)}>
            {ROLE_SLUGS.map((slug) => (
              <option key={slug} value={slug}>
                {ROLE_LABELS[slug]}
              </option>
            ))}
          </select>
        </label>
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
          Save {ROLE_LABELS[role]}
        </button>
      </div>
    </div>
  );
}
