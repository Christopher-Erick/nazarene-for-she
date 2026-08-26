"use client";

import { useRef, useState } from "react";
import { analyticsEvents, trackEvent } from "@/lib/analytics";

type Status = "idle" | "loading" | "success" | "error";

export function DonationInquiryForm({
  category,
  method,
}: {
  category: string;
  method: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const locked = useRef(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || status === "loading" || status === "success") return;
    locked.current = true;
    setStatus("loading");
    setMessage("");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/donation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, category, method }),
      });
      const payload = (await response.json()) as { ok: boolean; message: string };
      if (!response.ok || !payload.ok) {
        setStatus("error");
        setMessage(payload.message || "We could not send this just now. Please try again.");
        locked.current = false;
        return;
      }
      setStatus("success");
      setMessage(payload.message);
      form.reset();
      trackEvent(analyticsEvents.donationCtaClicked, { category, method });
    } catch {
      setStatus("error");
      setMessage("The network dropped the request. Check your connection and try again.");
      locked.current = false;
    }
  }

  const busy = status === "loading" || status === "success";

  return (
    <div className="border border-line bg-surface p-6 sm:p-8">
      <h2 className="font-display text-3xl">Tell us you are giving</h2>
      <p className="mt-3 text-sm text-muted">
        This is not a card checkout. Use it to confirm a transfer, ask a question, or leave a
        note with your gift. Do not send funds until official payment details are published.
      </p>
      <form className="mt-8 space-y-5" onSubmit={onSubmit} noValidate>
        <input
          type="text"
          name="website"
          className="sr-only"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <Field label="Your name" name="name" required disabled={busy} />
        <Field label="Email" name="email" type="email" required disabled={busy} />
        <Field label="Amount (optional)" name="amount" placeholder="KES" disabled={busy} />
        <label className="form-field">
          <span className="form-field-label">Note</span>
          <textarea name="message" maxLength={2000} disabled={busy} />
        </label>
        <div aria-live="polite">
          {status === "success" ? <p className="form-success">{message}</p> : null}
          {status === "error" ? <p className="form-failure">{message}</p> : null}
        </div>
        <button className="btn btn-plum w-full" type="submit" disabled={busy}>
          {status === "loading"
            ? "Sending…"
            : status === "success"
              ? "Note sent"
              : "Send confirmation"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  disabled,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="form-field">
      <span className="form-field-label">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
      />
    </label>
  );
}
