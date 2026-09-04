"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { aboutContent } from "@/lib/data/about";

const COPY_FIELDS = [
  { key: "description", label: "Who we are", fallback: aboutContent.whoWeAre.body },
  { key: "ourStory", label: "Our story", fallback: aboutContent.ourStory.body },
  { key: "approach", label: "Our approach", fallback: aboutContent.approach.body },
  { key: "faith", label: "Faith & discipleship", fallback: aboutContent.faith.body },
  { key: "community", label: "Community", fallback: aboutContent.community.body },
  { key: "sustainability", label: "Sustainability", fallback: aboutContent.sustainability.body },
  { key: "leadership", label: "Leadership", fallback: aboutContent.leadership.body },
  { key: "mission", label: "Mission (constitution)", fallback: aboutContent.mission.body },
  { key: "vision", label: "Vision (constitution)", fallback: aboutContent.vision.body },
] as const;

export function OrganizationEditor() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    adminFetch("/api/v1/admin/settings")
      .then((data) => {
        const stored = ((data.settings as Record<string, unknown>)?.organization ?? {}) as Record<string, string>;
        const next: Record<string, string> = {
          phone: stored.phone || "",
          whatsapp: String(stored.whatsapp ?? "").replace(/\D/g, ""),
        };
        for (const field of COPY_FIELDS) {
          next[field.key] = stored[field.key] || field.fallback;
        }
        setValues(next);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    try {
      await adminFetch("/api/v1/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          key: "organization",
          value: {
            ...values,
            phone: (values.phone ?? "").trim(),
            whatsapp: (values.whatsapp ?? "").replace(/\D/g, ""),
          },
        }),
      });
      setMessage("Saved. Why We Exist, Contact, and WhatsApp checkout read this directly.");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    }
  }

  return (
    <form className="admin-stack" onSubmit={save}>
      <AdminHeader kicker="The organisation" title="Organization" previewHref="/about">
        <p>
          These sections appear on Why We Exist. Do not invent unconfirmed facts. Mission and vision
          follow the January 2021 constitution unless the organisation has formally restated them.
        </p>
      </AdminHeader>
      {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}
      {message ? <p className="admin-flash admin-flash--ok">{message}</p> : null}
      <div className="admin-form">
        <h2 className="admin-form-title font-display">How to reach the workshop</h2>
        <label>
          Public phone
          <input
            type="tel"
            autoComplete="tel"
            value={values.phone ?? ""}
            onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))}
          />
        </label>
        <p className="admin-help">
          Shown on the contact page. Leave blank to keep using the site environment number.
        </p>
        <label>
          Workshop WhatsApp
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="2547XXXXXXXX"
            value={values.whatsapp ?? ""}
            onChange={(event) =>
              setValues((current) => ({ ...current, whatsapp: event.target.value.replace(/\D/g, "") }))
            }
          />
        </label>
        <p className="admin-help">
          Digits with country code. Used for Order via WhatsApp when WHATSAPP_NUMBER is not set in
          the environment. Leave blank to hide that checkout action.
        </p>
      </div>
      <div className="admin-form">
        <h2 className="admin-form-title font-display">Why We Exist</h2>
        {COPY_FIELDS.map((field) => (
          <label key={field.key}>
            {field.label}
            <textarea
              rows={field.key === "mission" || field.key === "vision" ? 3 : 5}
              value={values[field.key] ?? ""}
              onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
            />
          </label>
        ))}
        <button className="btn btn-plum" type="submit">
          Save organization copy
        </button>
      </div>
    </form>
  );
}
