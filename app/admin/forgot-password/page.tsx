"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import { BrandMark } from "@/components/ui/BrandMark";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const data = await adminFetch("/api/v1/admin/password-reset", {
        method: "POST",
        body: JSON.stringify({ email: String(form.get("email") ?? "") }),
      });
      setDevLink(typeof data.devLink === "string" ? data.devLink : "");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the link. Try again.");
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
            <h1 className="font-display">Forgot password</h1>
          </div>
          <ThemeToggle />
        </header>
        {sent ? (
          <>
            <p className="admin-flash admin-flash--ok mt-4">
              If that email belongs to an active admin account, a reset link is on its way. It works
              for one hour. Check your spam folder if it does not arrive in a few minutes.
            </p>
            {devLink ? (
              <p className="admin-login-lede mt-4">
                Development only — <Link href={devLink.replace(/^https?:\/\/[^/]+/, "")}>open the reset link</Link>
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="admin-login-lede">Enter your admin email and we will send you a link to choose a new password.</p>
            {error ? <p className="admin-flash admin-flash--error mt-4">{error}</p> : null}
            <form className="admin-form mt-7" onSubmit={onSubmit}>
              <label>
                Email
                <input name="email" type="email" autoComplete="username" required />
              </label>
              <button className="btn btn-plum" type="submit" disabled={pending}>
                {pending ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}
        <p className="admin-login-lede mt-6">
          <Link href="/admin/login">← Back to sign in</Link>
        </p>
      </div>
    </main>
  );
}
