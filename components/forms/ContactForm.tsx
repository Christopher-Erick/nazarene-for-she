"use client";

import { useRef, useState } from "react";
import { analyticsEvents, trackEvent } from "@/lib/analytics";
import { contactIntents } from "@/lib/validation/contact";

const labels: Record<(typeof contactIntents)[number], string> = {
  general: "General",
  partnership: "Partnership",
  mentorship: "Mentorship",
  donation: "Donation inquiry",
  resources: "Give resources",
  prayer: "Prayer",
};

export function ContactForm({ initialIntent }: { initialIntent?: string }) {
  const intent = contactIntents.includes(initialIntent as (typeof contactIntents)[number])
    ? initialIntent
    : "general";
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const locked = useRef(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || status === "loading" || status === "success") return;
    locked.current = true;
    setStatus("loading");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = (await response.json()) as { ok: boolean; message: string };
      if (!response.ok || !payload.ok) {
        setStatus("error");
        setMessage(payload.message || "Something went wrong. Please try again.");
        locked.current = false;
        return;
      }
      setStatus("success");
      setMessage(payload.message);
      const chosen = String(data.intent ?? "general");
      if (chosen === "mentorship") trackEvent(analyticsEvents.mentorshipInquiry);
      if (chosen === "partnership") trackEvent(analyticsEvents.partnershipInquiry);
      trackEvent(analyticsEvents.contactFormSubmitted, { intent: chosen });
      form.reset();
    } catch {
      setStatus("error");
      setMessage("We lost the connection. Please try again when your network is stable.");
      locked.current = false;
    }
  }

  const busy = status === "loading" || status === "success";

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <input
        type="text"
        name="website"
        className="sr-only"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      <label className="form-field">
        <span className="form-field-label">Name</span>
        <input name="name" required minLength={2} disabled={busy} />
      </label>
      <label className="form-field">
        <span className="form-field-label">Email</span>
        <input name="email" type="email" required disabled={busy} />
      </label>
      <label className="form-field">
        <span className="form-field-label">Phone (optional)</span>
        <input name="phone" type="tel" disabled={busy} />
      </label>
      <label className="form-field">
        <span className="form-field-label">How can we walk together?</span>
        <select name="intent" defaultValue={intent} disabled={busy}>
          {contactIntents.map((value) => (
            <option key={value} value={value}>
              {labels[value]}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span className="form-field-label">Organisation (optional)</span>
        <input name="organisation" disabled={busy} />
      </label>
      <label className="form-field">
        <span className="form-field-label">Message</span>
        <textarea name="message" required minLength={12} disabled={busy} />
      </label>
      <div aria-live="polite">
        {status === "success" ? <p className="form-success">{message}</p> : null}
        {status === "error" ? <p className="form-failure">{message}</p> : null}
      </div>
      <button className="btn btn-plum" type="submit" disabled={busy}>
        {status === "loading" ? "Sending…" : status === "success" ? "Message sent" : "Send message"}
      </button>
    </form>
  );
}
