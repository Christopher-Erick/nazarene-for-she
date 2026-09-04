"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";

type Row = {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  created_at: number;
  user_id: string | null;
};

export default function AuditPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch("/api/v1/admin/audit")
      .then((data) => setItems((data.items as Row[]) ?? []))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div>
      <h1 className="font-display text-4xl">Audit logs</h1>
      <p className="mt-2 text-muted">Security and CMS actions. Passwords and secrets are never stored here.</p>
      {error ? <p className="admin-flash mt-4">{error}</p> : null}
      <table className="admin-table mt-6">
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
  );
}
