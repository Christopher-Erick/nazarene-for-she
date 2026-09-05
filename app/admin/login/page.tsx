"use client";

import { FormEvent, useState } from "react";
import { adminFetch, ensureCsrf } from "@/components/admin/adminFetch";
import { BrandMark } from "@/components/ui/BrandMark";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

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
    <main className="admin-login">
      <div className="admin-login-card">
        <header className="admin-login-head">
          <BrandMark className="admin-brand__mark text-primary" />
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-accent">Nazarene for She</p>
            <h1 className="font-display">Sign in</h1>
          </div>
          <ThemeToggle />
        </header>
        <p className="admin-login-lede">This desk is for authorised organisational users only.</p>
        {error ? <p className="admin-flash admin-flash--error mt-4">{error}</p> : null}
        <form className="admin-form mt-7" onSubmit={onSubmit}>
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
      </div>
    </main>
  );
}
