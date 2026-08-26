"use client";

import { useState } from "react";
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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
        return;
      }
      setStatus("success");
      setMessage(payload.message);
      form.reset();
      trackEvent(analyticsEvents.donationCtaClicked, { category, method });
    } catch {
      setStatus("error");
      setMessage("The network dropped the request. Check your connection and try again.");
    }
  }

  return (
    <div className="border border-line bg-surface p-6 sm:p-8">
      <h2 className="font-display text-3xl">Tell us you are giving</h2>
      <p className="mt-3 text-sm text-muted">
        This is not a card checkout. Use it to confirm a transfer, ask a question, or leave a
        note with your gift.
      </p>
      <form className="mt-8 space-y-5" onSubmit={onSubmit} noValidate>
        <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
        <Field label="Your name" name="name" required />
        <Field label="Email" name="email" type="email" required />
        <Field label="Amount (optional)" name="amount" placeholder="KES" />
        <label className="form-field">
          <span>Note</span>
          <textarea name="message" maxLength={2000} />
        </label>
        {status === "success" ? <p className="form-success">{message}</p> : null}
        {status === "error" ? <p className="form-failure">{message}</p> : null}
        <button className="btn btn-plum w-full" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Sending…" : "Send confirmation"}
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
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input name={name} type={type} required={required} placeholder={placeholder} />
    </label>
  );
}
