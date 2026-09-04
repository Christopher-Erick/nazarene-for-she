"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";

export default function AccountPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    adminFetch("/api/v1/admin/account")
      .then((data) => {
        const user = data.user as { name: string; email: string; roleName: string };
        setName(user.name);
        setEmail(user.email);
        setRole(user.roleName);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await adminFetch("/api/v1/admin/account", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          email,
          currentPassword: form.get("currentPassword") || undefined,
          newPassword: form.get("newPassword") || undefined,
        }),
      });
      setMessage("Account updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update.");
    }
  }

  async function request(type: "export" | "deletion") {
    try {
      await adminFetch("/api/v1/admin/account", {
        method: "POST",
        body: JSON.stringify({ requestType: type }),
      });
      setMessage(type === "export" ? "Export request recorded." : "Deletion request recorded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit request.");
    }
  }

  async function download() {
    const data = await adminFetch("/api/v1/admin/account/export");
    const blob = new Blob([JSON.stringify(data.export, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "nazarene-for-she-account.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h1 className="font-display text-4xl">My account</h1>
      <p className="mt-2 text-muted">{role}</p>
      {error ? <p className="admin-flash mt-4">{error}</p> : null}
      {message ? <p className="admin-flash mt-4">{message}</p> : null}
      <form className="admin-form mt-8" onSubmit={save}>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          Email
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <p className="text-sm text-muted">
          Saving a new email replaces the old one. Sign in with the new address after that. Enter your
          current password to confirm an email change.
        </p>
        <label>
          Current password
          <input name="currentPassword" type="password" autoComplete="current-password" />
        </label>
        <label>
          New password
          <input name="newPassword" type="password" autoComplete="new-password" />
        </label>
        <button className="btn btn-plum" type="submit">
          Save
        </button>
      </form>
      <div className="mt-8 flex flex-wrap gap-3">
        <button className="btn btn-ghost" type="button" onClick={download}>
          Download my data
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => request("export")}>
          Request export
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => request("deletion")}>
          Request account deletion
        </button>
      </div>
    </div>
  );
}
