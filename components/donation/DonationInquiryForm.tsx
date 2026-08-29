"use client";

import { useRef, useState } from "react";
import { analyticsEvents, trackEvent } from "@/lib/analytics";

type Status = "idle" | "loading" | "success" | "error";

export function DonationInquiryForm({
  category = "general",
  method = "mchanga",
  id,
  variant = "landing",
  onSuccess,
}: {
  category?: string;
  method?: string;
  id?: string;
  variant?: "landing" | "wizard";
  onSuccess?: () => void;
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
      onSuccess?.();
    } catch {
      setStatus("error");
      setMessage("The network dropped the request. Check your connection and try again.");
      locked.current = false;
    }
  }

  const busy = status === "loading" || status === "success";

  return (
    <div id={id} className="give-form scroll-mt-28">
      {variant === "landing" ? (
        <p className="section-kicker text-primary give-form__kicker">
          <b>02</b>
          Tell us you are giving
        </p>
      ) : null}
      <form className="give-form__body" onSubmit={onSubmit} noValidate>
        <input
          type="text"
          name="website"
          className="sr-only"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <div className="give-form__grid give-form__grid--duo">
          <Field label="Your name" name="name" required disabled={busy} autoComplete="name" />
          <Field label="Email" name="email" type="email" required disabled={busy} autoComplete="email" />
        </div>
        <Field
          label="Amount (optional)"
          name="amount"
          placeholder="e.g. KES 2,000"
          disabled={busy}
          hint="Rough figure is fine — it helps the team follow up."
        />
        <label className="form-field">
          <span className="form-field-label">Note</span>
          <textarea
            name="message"
            maxLength={2000}
            disabled={busy}
            placeholder="Which cause you chose, when you gave, or anything the team should know."
          />
        </label>
        <div aria-live="polite">
          {status === "success" ? <p className="form-success">{message}</p> : null}
          {status === "error" ? <p className="form-failure">{message}</p> : null}
        </div>
        <button className="btn btn-plum give-form__submit w-full" type="submit" disabled={busy}>
          {status === "loading"
            ? "Sending…"
            : status === "success"
              ? "Note sent"
              : "Send confirmation note"}
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
  hint,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
  autoComplete?: string;
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
        autoComplete={autoComplete}
      />
      {hint ? <span className="give-form__hint">{hint}</span> : null}
    </label>
  );
}
