"use client";

import { FormEvent, useState } from "react";
import { adminFetch, ensureCsrf } from "@/components/admin/adminFetch";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await ensureCsrf();
      await adminFetch("/api/v1/admin/session", {
        method: "POST",
        body: JSON.stringify({
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        }),
      });
      window.location.href = "/admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <p className="eyebrow text-accent">Nazarene for She</p>
      <h1 className="mt-2 font-display text-4xl">Sign in</h1>
      <p className="mt-3 text-muted">This area is for authorised organisational users only.</p>
      {error ? <p className="admin-flash mt-4">{error}</p> : null}
      <form className="admin-form mt-8" onSubmit={onSubmit}>
        <label>
          Email
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button className="btn btn-plum" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
