"use client";

import { useMemo, useState } from "react";
import { DonationInquiryForm } from "@/components/donation/DonationInquiryForm";
import { donationCategories, donationIntro, donationMethods } from "@/lib/data/donation";
import { trackEvent, analyticsEvents } from "@/lib/analytics";

export function DonationExperience({ initialCause }: { initialCause?: string }) {
  const initial = donationCategories.some((category) => category.id === initialCause)
    ? initialCause
    : "general";
  const [category, setCategory] = useState(initial ?? "general");
  const [method, setMethod] = useState<(typeof donationMethods)[number]["id"]>("mpesa");
  const selectedMethod = useMemo(
    () => donationMethods.find((item) => item.id === method) ?? donationMethods[0],
    [method],
  );
  const paymentReady = selectedMethod.fields.some((field) => field.value && !field.placeholder);

  return (
    <>
      <header className="bleed-hero theme-band">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-28 sm:px-8 lg:pt-32">
          <p className="eyebrow text-accent">Support a girl</p>
          <h1 className="display-lg mt-5 max-w-4xl">Help remove a barrier between her and her future.</h1>
          <p className="mt-6 max-w-2xl text-lg theme-muted">{donationIntro}</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-12">
        <div className="order-1 lg:order-2 lg:col-span-5">
          <DonationInquiryForm category={category} method={method} />
        </div>

        <div className="order-2 lg:order-1 lg:col-span-7">
          <h2 className="font-display text-3xl">Where your gift can go</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {donationCategories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setCategory(item.id);
                  trackEvent(analyticsEvents.donationCtaClicked, { category: item.id });
                }}
                className={`donation-cause min-h-11 border p-5 text-left transition ${
                  category === item.id
                    ? "border-primary bg-lavender"
                    : "border-line bg-surface hover:border-primary/40"
                }`}
                aria-pressed={category === item.id}
              >
                <p className="font-display text-2xl">{item.name}</p>
                <p className="mt-2 text-sm text-muted">{item.description}</p>
              </button>
            ))}
          </div>

          <h2 className="mt-16 font-display text-3xl">
            {paymentReady ? "Give through official channels" : "Official payment details"}
          </h2>
          <p className="mt-3 text-sm text-muted">
            {paymentReady
              ? "Use only the details published here. After you transfer, send a confirmation note so the team can thank you and allocate the gift."
              : "Payment numbers are not published yet. Use the confirmation form first — then transfer only when official M-Pesa, bank or M-Changa details appear here."}
          </p>
          <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Donation methods">
            {donationMethods.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={method === item.id}
                className={`min-h-11 px-4 text-sm font-semibold ${
                  method === item.id ? "bg-primary text-ivory" : "border border-line"
                }`}
                onClick={() => {
                  setMethod(item.id);
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
        </div>
      </div>
    </>
  );
}
