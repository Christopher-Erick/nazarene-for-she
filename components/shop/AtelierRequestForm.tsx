"use client";

import { useRef, useState } from "react";
import { analyticsEvents, trackEvent } from "@/lib/analytics";
import { fitLabels, fitsFor, getCloth, getGarment, type GarmentFit } from "@/lib/data/shop";
import {
  bundleCount,
  clearBundle,
  releasePiece,
  updatePiece,
  useAtelierBundle,
} from "@/components/shop/useAtelierBundle";

type Status = "idle" | "loading" | "success" | "error";

export function AtelierRequestForm() {
  const { items } = useAtelierBundle();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const locked = useRef(false);
  const count = bundleCount(items);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || status === "loading" || status === "success") return;
    if (items.length === 0) {
      setStatus("error");
      setMessage("Add at least one piece before sending a request.");
      return;
    }
    locked.current = true;
    setStatus("loading");
    setMessage("");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const note = String(data.message ?? "");
    const clothLines = items
      .map((item) => {
        const garment = getGarment(item.slug);
        const clothName = getCloth(item.cloth)?.name ?? item.cloth;
        return `${garment?.name ?? item.slug}: ${clothName}`;
      })
      .join("\n");
    const composed = clothLines ? `Cloth preference:\n${clothLines}\n\n${note}` : note;

    try {
      const response = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          gift: data.gift === "on",
          items,
          message: composed,
        }),
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
      clearBundle();
      trackEvent(analyticsEvents.atelierRequested, { pieces: String(count) });
    } catch {
      setStatus("error");
      setMessage("The network dropped the request. Check your connection and try again.");
      locked.current = false;
    }
  }

  const busy = status === "loading" || status === "success";

  return (
    <div id="request" className="atelier-request">
      <h2 className="font-display text-3xl">Request these pieces</h2>
      <p className="mt-3 text-sm text-muted">
        This is not a card checkout. Choose the pieces you want. We reply with a fair price, a
        making time, and official payment details. Do not send funds until that reply arrives.
      </p>
      {items.length === 0 ? (
        <p className="mt-6 text-muted">
          Choose a dress, a uniform, a kitenge or a tote to begin — her work, your request.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {items.map((item) => {
            const garment = getGarment(item.slug);
            const sizeOptions = garment ? fitsFor(garment) : [];
            return (
              <li key={item.slug} className="border-t border-line pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-2xl">{garment?.name ?? item.slug}</p>
                    <p className="mt-1 text-sm text-muted">
                      {item.quantity} × {fitLabels[item.fit]} · {getCloth(item.cloth)?.name ?? "Plum"}{" "}
                      · price on request
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                    onClick={() => releasePiece(item.slug)}
                  >
                    Release
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <label className="form-field min-w-28 flex-1">
                    <span className="form-field-label">Qty</span>
                    <select
                      value={item.quantity}
                      disabled={busy}
                      onChange={(event) =>
                        updatePiece(item.slug, { quantity: Number(event.target.value) })
                      }
                    >
                      {[1, 2, 3].map((qty) => (
                        <option key={qty} value={qty}>
                          {qty}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-field min-w-28 flex-1">
                    <span className="form-field-label">Fit</span>
                    <select
                      value={item.fit}
                      disabled={busy}
                      onChange={(event) =>
                        updatePiece(item.slug, { fit: event.target.value as GarmentFit })
                      }
                    >
                      {sizeOptions.map((value) => (
                        <option key={value} value={value}>
                          {fitLabels[value]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form className="mt-8 space-y-5" onSubmit={onSubmit} noValidate>
        <input
          type="text"
          name="website"
          className="sr-only"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <label className="form-field">
          <span className="form-field-label">Your name</span>
          <input name="name" required minLength={2} disabled={busy || items.length === 0} />
        </label>
        <label className="form-field">
          <span className="form-field-label">Email</span>
          <input name="email" type="email" required disabled={busy || items.length === 0} />
        </label>
        <label className="form-field">
          <span className="form-field-label">Phone (optional)</span>
          <input name="phone" type="tel" disabled={busy || items.length === 0} />
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input name="gift" type="checkbox" disabled={busy || items.length === 0} />
          This is a gift
        </label>
        <label className="form-field">
          <span className="form-field-label">Colour, occasion, or fit notes</span>
          <textarea
            name="message"
            required
            minLength={12}
            disabled={busy || items.length === 0}
            placeholder="Tell the workshop what this piece needs to live in."
          />
        </label>
        <div aria-live="polite">
          {status === "success" ? <p className="form-success">{message}</p> : null}
          {status === "error" ? <p className="form-failure">{message}</p> : null}
        </div>
        <button className="btn btn-plum w-full" type="submit" disabled={busy || items.length === 0}>
          {status === "loading"
            ? "Sending…"
            : status === "success"
              ? "Request sent"
              : "Request these pieces"}
        </button>
      </form>
    </div>
  );
}
