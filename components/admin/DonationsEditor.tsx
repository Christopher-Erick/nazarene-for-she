"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { donationIntro, donationMethods, type DonationMethod } from "@/lib/data/donation";

function cloneMethods(input: unknown): DonationMethod[] {
  if (!Array.isArray(input) || !input.length) {
    return donationMethods.map((method) => ({
      ...method,
      fields: method.fields.map((field) => ({ ...field })),
    }));
  }
  return donationMethods.map((template) => {
    const found = input.find((row) => row && typeof row === "object" && (row as DonationMethod).id === template.id) as
      | DonationMethod
      | undefined;
    if (!found) {
      return { ...template, fields: template.fields.map((field) => ({ ...field })) };
    }
    return {
      ...template,
      name: found.name || template.name,
      description: found.description || template.description,
      fields: template.fields.map((field, index) => ({
        label: found.fields?.[index]?.label || field.label,
        value: found.fields?.[index]?.value ?? field.value,
        placeholder: Boolean(found.fields?.[index]?.placeholder ?? field.placeholder),
      })),
    };
  });
}

export function DonationsEditor() {
  const [intro, setIntro] = useState(donationIntro);
  const [note, setNote] = useState("");
  const [methods, setMethods] = useState<DonationMethod[]>(() => cloneMethods(donationMethods));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    adminFetch("/api/v1/admin/settings")
      .then((data) => {
        const stored = ((data.settings as Record<string, unknown>)?.donations ?? {}) as {
          intro?: string;
          note?: string;
          methods?: DonationMethod[];
        };
        setIntro(stored.intro || donationIntro);
        setNote(stored.note || "");
        setMethods(cloneMethods(stored.methods));
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    try {
      await adminFetch("/api/v1/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ key: "donations", value: { intro, note, methods } }),
      });
      setMessage("Saved. Payment details appear on Support A Girl when they are not marked as placeholders.");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    }
  }

  function updateMethod(index: number, next: DonationMethod) {
    setMethods((current) => current.map((method, i) => (i === index ? next : method)));
  }

  return (
    <form onSubmit={save}>
      <AdminHeader kicker="Support A Girl" title="Donations" previewHref="/donate">
        <p>
          M-Pesa, bank and M-Changa are the ways visitors can give. Leave a field marked as a
          placeholder until the organisation confirms the official number. Never invent paybill or
          account details.
        </p>
      </AdminHeader>
      {error ? <p className="admin-flash mt-4">{error}</p> : null}
      {message ? <p className="admin-flash mt-4">{message}</p> : null}
      <div className="admin-form mt-8">
        <label>
          Opening on Support A Girl
          <textarea rows={4} value={intro} onChange={(event) => setIntro(event.target.value)} />
        </label>
        <label>
          Note under payment details (optional)
          <textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
      </div>
      {methods.map((method, methodIndex) => (
        <article key={method.id} className="admin-piece mt-6">
          <h2 className="font-display text-2xl">{method.name}</h2>
          <label className="admin-field mt-3">
            How this way of giving is described
            <textarea
              rows={2}
              value={method.description}
              onChange={(event) => updateMethod(methodIndex, { ...method, description: event.target.value })}
            />
          </label>
          {method.fields.map((field, fieldIndex) => (
            <div key={field.label} className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
              <label className="admin-field">
                {field.label}
                <input
                  value={field.value}
                  onChange={(event) => {
                    const fields = method.fields.map((row, i) =>
                      i === fieldIndex ? { ...row, value: event.target.value } : row,
                    );
                    updateMethod(methodIndex, { ...method, fields });
                  }}
                />
              </label>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={field.placeholder}
                  onChange={(event) => {
                    const fields = method.fields.map((row, i) =>
                      i === fieldIndex ? { ...row, placeholder: event.target.checked } : row,
                    );
                    updateMethod(methodIndex, { ...method, fields });
                  }}
                />
                Still a placeholder
              </label>
            </div>
          ))}
        </article>
      ))}
      <button className="btn btn-plum mt-6" type="submit">
        Save donation details
      </button>
    </form>
  );
}
