"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import { AdminHeader } from "@/components/admin/AdminHeader";

type Row = {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  created_at: number;
  user_id: string | null;
};

export default function AuditPage() {
  const [items, setItems] = useState<Row[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch("/api/v1/admin/audit")
      .then((data) => setItems((data.items as Row[]) ?? []))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="admin-stack">
      <AdminHeader kicker="Security" title="Audit logs">
        <p>Security and CMS actions. Passwords and secrets are never stored here.</p>
      </AdminHeader>
      {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}
      {!items && !error ? <p className="admin-loading">Loading the audit log…</p> : null}
      {items && !items.length ? <p className="admin-empty">No actions recorded yet.</p> : null}
      {items?.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Resource</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.created_at).toLocaleString()}</td>
                  <td>{row.action}</td>
                  <td>
                    {row.resource_type}
                    {row.resource_id ? ` · ${row.resource_id.slice(0, 8)}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
