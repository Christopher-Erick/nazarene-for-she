"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { DonationInquiryForm } from "@/components/donation/DonationInquiryForm";
import { DonationPathTrack } from "@/components/donation/DonationPathTrack";
import { DonationPaymentPanel } from "@/components/donation/DonationPaymentPanel";
import {
  donationCategories,
  donationMethods,
  donationThankYou,
  donationWizardGiveCta,
} from "@/lib/data/donation";
import { trackEvent, analyticsEvents } from "@/lib/analytics";

type WizardStep = 1 | 2 | 3;

export function DonationWizard({
  step,
  category,
  method,
  showGiveForm,
  noteSubmitted,
  onClose,
  onStep,
  onCategory,
  onMethod,
  onOpenGiveForm,
  onNoteSubmitted,
}: {
  step: WizardStep;
  category: string;
  method: (typeof donationMethods)[number]["id"];
  showGiveForm: boolean;
  noteSubmitted: boolean;
  onClose: () => void;
  onStep: (step: WizardStep) => void;
  onCategory: (id: string) => void;
  onMethod: (method: (typeof donationMethods)[number]["id"]) => void;
  onOpenGiveForm: () => void;
  onNoteSubmitted: () => void;
}) {
  const router = useRouter();
  const giveFormRef = useRef<HTMLDivElement>(null);

  function chooseCategory(id: string) {
    onCategory(id);
    trackEvent(analyticsEvents.donationCtaClicked, { category: id });
    window.setTimeout(() => onStep(2), 180);
  }

  function openGiveForm() {
    onOpenGiveForm();
    window.requestAnimationFrame(() => {
      giveFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (step === 1) {
    return (
      <section className="donation-wizard donation-wizard--causes bleed-hero theme-band">
        <div className="donation-wizard-frame mx-auto max-w-6xl">
          <div className="donation-wizard-topbar">
            <p className="eyebrow text-accent">Support a girl by giving</p>
            <button type="button" className="donation-wizard-exit" onClick={onClose}>
              All ways to give
            </button>
          </div>

          <h1 className="donate-landing-hero__title mt-4 max-w-2xl">To Donate Towards</h1>

          <p className="donation-wizard-give-cta theme-muted">{donationWizardGiveCta}</p>

          <div className="donation-wizard-track">
            <DonationPathTrack
              step={step}
              categoryId={category}
              methodId={method}
              onJump={onStep}
              embedded
            />
          </div>

          <div className="donation-cause-board">
            <p className="eyebrow text-accent">Where your gift can go</p>
            <p className="donation-cause-board__lead mt-2 theme-muted">
              Pick one — we will show official payment details next.
            </p>
            <ul className="donation-cause-board__grid">
              {donationCategories.map((item, index) => (
                <li key={item.id} className="donation-cause-board__cell">
                  <button
                    type="button"
                    onClick={() => chooseCategory(item.id)}
                    className={`give-path donation-cause-path text-left ${
                      category === item.id ? "is-current" : ""
                    }`}
                    aria-pressed={category === item.id}
                  >
                    <span className="eyebrow">{String(index + 1).padStart(2, "0")}</span>
                    <span className="mt-1.5 block font-display text-lg">{item.name}</span>
                    <span className="donation-cause-path__desc mt-1.5 block text-sm theme-muted">
                      {item.description}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <header className="bleed-hero theme-band">
        <div className="mx-auto max-w-6xl px-5 pb-10 pt-28 sm:px-8">
          <div className="donation-wizard-topbar">
            <p className="eyebrow text-accent">Support a girl by giving</p>
            <button type="button" className="donation-wizard-exit" onClick={onClose}>
              All ways to give
            </button>
          </div>
          <h1 className="donate-landing-hero__title mt-4 max-w-2xl">
            {step === 2 ? "How to give" : "Thank you"}
          </h1>
          <div className="donation-wizard-track mt-5">
            <DonationPathTrack
              step={step}
              categoryId={category}
              methodId={method}
              onJump={onStep}
              embedded
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 pb-24 pt-6 sm:px-8">
        {step === 2 ? (
          <section className="donation-wizard-panel">
            <DonationPaymentPanel method={method} onMethodChange={onMethod} />
            <div className="mt-10 flex flex-wrap gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => onStep(1)}>
                Back
              </button>
              <button type="button" className="btn btn-plum" onClick={() => onStep(3)}>
                I&apos;ve seen where to pay
              </button>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="donation-wizard-panel">
            <div className="donation-thanks">
              <p className="eyebrow text-accent">From all of us</p>
              <h2 className="font-display mt-4 text-3xl">{donationThankYou.title}</h2>
              <p className="mt-4 text-lg text-muted">{donationThankYou.body}</p>
              {noteSubmitted ? (
                <p className="form-success mt-6">{donationThankYou.noteReceived}</p>
              ) : null}
            </div>

            <div className="mt-12">
              <DonationPaymentPanel
                method={method}
                heading="Your payment details"
                id="wizard-payment-copy"
              />
            </div>

            {!showGiveForm ? (
              <div className="mt-10 flex flex-wrap gap-3">
                <button type="button" className="btn btn-plum" onClick={openGiveForm}>
                  Leave a message
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => router.push("/")}>
                  Complete
                </button>
              </div>
            ) : (
              <div ref={giveFormRef} className="mt-12">
                <DonationInquiryForm
                  id="give-form-wizard"
                  variant="wizard"
                  category={category}
                  method={method}
                  onSuccess={onNoteSubmitted}
                />
                <div className="mt-10">
                  <button type="button" className="btn btn-ghost" onClick={() => router.push("/")}>
                    Complete
                  </button>
                </div>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </>
  );
}
