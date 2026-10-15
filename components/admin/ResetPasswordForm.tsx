"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import { BrandMark } from "@/components/ui/BrandMark";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function ResetPasswordForm({ token }: { token: string }) {
  // Take the token out of the address bar so it is not left in history or shared by accident.
  useEffect(() => {
    if (token && window.location.search) window.history.replaceState(null, "", window.location.pathname);
  }, [token]);

  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirm") ?? "")) {
      setError("The two passwords do not match.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await adminFetch("/api/v1/admin/password-reset", {
        method: "PUT",
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set the new password.");
    } finally {
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
            <h1 className="font-display">Choose a new password</h1>
          </div>
          <ThemeToggle />
        </header>
        {done ? (
          <>
            <p className="admin-flash admin-flash--ok mt-4">
              Your password has been changed and other devices have been signed out.
            </p>
            <p className="admin-login-lede mt-6">
              <Link className="btn btn-plum" href="/admin/login">
                Sign in
              </Link>
            </p>
          </>
        ) : !token ? (
          <>
            <p className="admin-flash admin-flash--error mt-4">
              This page needs the link from your reset email. Ask for a new one if it has expired.
            </p>
            <p className="admin-login-lede mt-6">
              <Link href="/admin/forgot-password">Send a new reset link</Link>
            </p>
          </>
        ) : (
          <>
            <p className="admin-login-lede">
              At least 14 characters, with upper and lower case letters, a number and a symbol.
            </p>
            {error ? <p className="admin-flash admin-flash--error mt-4">{error}</p> : null}
            <form className="admin-form mt-7" onSubmit={onSubmit}>
              <label>
                New password
                <input name="password" type="password" autoComplete="new-password" minLength={14} maxLength={128} required />
              </label>
              <label>
                Type it again
                <input name="confirm" type="password" autoComplete="new-password" minLength={14} maxLength={128} required />
              </label>
              <button className="btn btn-plum" type="submit" disabled={pending}>
                {pending ? "Saving…" : "Set new password"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
