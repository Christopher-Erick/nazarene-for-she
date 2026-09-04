"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DonationInquiryForm } from "@/components/donation/DonationInquiryForm";
import { DonationPaymentPanel } from "@/components/donation/DonationPaymentPanel";
import { DonationWizard } from "@/components/donation/DonationWizard";
import {
  donationCategories,
  donationMethods,
  donationWizardGiveCta,
} from "@/lib/data/donation";

type WizardStep = 1 | 2 | 3;

export function DonationExperience({
  initialCause,
  startWizard = false,
  methods = donationMethods,
  intro,
}: {
  initialCause?: string;
  startWizard?: boolean;
  methods?: typeof donationMethods;
  intro?: string;
}) {
  const hasValidCause = Boolean(
    initialCause && donationCategories.some((item) => item.id === initialCause),
  );
  const [wizardOpen, setWizardOpen] = useState(hasValidCause || startWizard);
  const [step, setStep] = useState<WizardStep>(1);
  const [category, setCategory] = useState(
    hasValidCause ? initialCause! : "general",
  );
  const [method, setMethod] = useState<(typeof donationMethods)[number]["id"]>("mchanga");
  const [showGiveForm, setShowGiveForm] = useState(false);
  const [noteSubmitted, setNoteSubmitted] = useState(false);

  useEffect(() => {
    if (hasValidCause) {
      setWizardOpen(true);
      setStep(1);
      setCategory(initialCause!);
    }
  }, [initialCause, hasValidCause]);

  function startGiveWizard() {
    setWizardOpen(true);
    setStep(1);
    setShowGiveForm(false);
    setNoteSubmitted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeWizard() {
    setWizardOpen(false);
    setStep(1);
    setShowGiveForm(false);
    setNoteSubmitted(false);
  }

  if (wizardOpen) {
    return (
      <DonationWizard
        step={step}
        category={category}
        method={method}
        showGiveForm={showGiveForm}
        noteSubmitted={noteSubmitted}
        onClose={closeWizard}
        onStep={(target) => {
          setStep(target);
          if (target < 3) setShowGiveForm(false);
        }}
        onCategory={setCategory}
        onMethod={setMethod}
        onOpenGiveForm={() => setShowGiveForm(true)}
        onNoteSubmitted={() => setNoteSubmitted(true)}
      />
    );
  }

  return (
    <>
      <header className="bleed-hero theme-band">
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-28 sm:px-8 lg:pb-20 lg:pt-32">
          <p className="eyebrow text-accent">Support a girl</p>
          <h1 className="donate-landing-hero__title mt-5 max-w-3xl">
            Help remove a barrier between her and her future.
          </h1>
          <p className="donate-landing-hero__lead mt-5 max-w-xl theme-muted">{intro || donationWizardGiveCta}</p>

          <div className="mt-12 max-w-4xl">
            <p className="eyebrow text-accent">Three ways to walk with her</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <button type="button" className="give-path is-current text-left" onClick={startGiveWizard}>
                <span className="eyebrow">Give</span>
                <span className="mt-2 block font-display text-xl">Support A Girl</span>
                <span className="mt-2 block text-sm theme-muted">
                  A gift toward pads, skill and community.
                </span>
              </button>
              <Link href="/shop" className="give-path">
                <span className="eyebrow">Wear</span>
                <span className="mt-2 block font-display text-xl">Buy her work</span>
                <span className="mt-2 block text-sm theme-muted">
                  A garment from the workshop, sold as her income.
                </span>
              </Link>
              <Link href="/stories" className="give-path sm:col-span-2 lg:col-span-1">
                <span className="eyebrow">Stories</span>
                <span className="mt-2 block font-display text-xl">Gift from her story</span>
                <span className="mt-2 block text-sm theme-muted">
                  Read consented stories — then gift a girl from the stories now.
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-12 lg:py-12">
        <div className="lg:col-span-5">
          <DonationInquiryForm id="give-form" category={category} method={method} />
        </div>
        <div className="lg:col-span-7">
          <DonationPaymentPanel method={method} onMethodChange={setMethod} id="official-payment" methods={methods} />
        </div>
      </div>
    </>
  );
}
