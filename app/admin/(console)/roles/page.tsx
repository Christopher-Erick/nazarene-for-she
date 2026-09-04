"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import { CMS_ACTIONS, CMS_MODULES, ROLE_LABELS, ROLE_SLUGS, type RoleSlug } from "@/lib/cms/permissions";

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
    load().catch((err: Error) => setError(err.message));
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

  if (error) return <p className="admin-flash">{error}</p>;

  return (
    <div>
      <h1 className="font-display text-4xl">Roles & Permissions</h1>
      <p className="mt-2 text-muted">
        Only Super Admin can open this page. Other roles receive 403 if they request it directly.
      </p>
      {message ? <p className="admin-flash mt-4">{message}</p> : null}
      <label className="admin-field mt-6 max-w-xs">
        Role
        <select value={role} onChange={(event) => setRole(event.target.value as RoleSlug)}>
          {ROLE_SLUGS.map((slug) => (
            <option key={slug} value={slug}>
              {ROLE_LABELS[slug]}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-6 overflow-x-auto">
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
            {CMS_MODULES.map((module) => (
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
      <button className="btn btn-plum mt-6" type="button" onClick={save} disabled={role === "super_admin"}>
        Save {ROLE_LABELS[role]}
      </button>
    </div>
  );
}
