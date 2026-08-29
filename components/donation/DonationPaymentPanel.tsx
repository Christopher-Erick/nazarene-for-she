"use client";

import { useMemo } from "react";
import { donationMethods } from "@/lib/data/donation";
import { trackEvent, analyticsEvents } from "@/lib/analytics";

export function DonationPaymentPanel({
  method,
  onMethodChange,
  heading = "Official payment details",
  id,
}: {
  method: (typeof donationMethods)[number]["id"];
  onMethodChange?: (method: (typeof donationMethods)[number]["id"]) => void;
  heading?: string;
  id?: string;
}) {
  const selectedMethod = useMemo(
    () => donationMethods.find((item) => item.id === method) ?? donationMethods[0],
    [method],
  );
  const paymentReady = selectedMethod.fields.some((field) => field.value && !field.placeholder);
  const interactive = Boolean(onMethodChange);

  return (
    <section id={id} className="donation-payment" aria-labelledby={id ? `${id}-heading` : undefined}>
      <h2 id={id ? `${id}-heading` : undefined} className="font-display text-3xl">
        {paymentReady ? "Give through official channels" : heading}
      </h2>
      <p className="mt-3 text-sm text-muted">
        {paymentReady
          ? "Use only the details published here. After you transfer, you can leave a confirmation note so the team can thank you and allocate the gift."
          : "Payment numbers are not published yet. Transfer only when official M-Pesa, bank or M-Changa details appear here."}
      </p>
      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Donation methods">
        {donationMethods.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={method === item.id}
            disabled={!interactive}
            className={`donation-payment__tab min-h-11 px-4 text-sm font-semibold ${
              method === item.id ? "is-active" : ""
            } ${!interactive ? "cursor-default" : ""}`}
            onClick={() => {
              onMethodChange?.(item.id);
              trackEvent(analyticsEvents.donationMethodSelected, { method: item.id });
            }}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="mt-6 border border-line bg-surface p-6">
        <p className="text-muted">{selectedMethod.description}</p>
        <dl className="mt-6 space-y-4">
          {selectedMethod.fields.map((field) => (
            <div key={field.label}>
              <dt className="eyebrow text-primary">{field.label}</dt>
              <dd className="mt-2 font-display text-2xl">
                {field.placeholder || !field.value ? (
                  <span className="text-muted">
                    Awaiting official details
                    <span className="placeholder-chip ml-3 align-middle">Placeholder</span>
                  </span>
                ) : (
                  field.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
