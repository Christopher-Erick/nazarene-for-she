"use client";

import { donationCategories, donationMethods, donationWizardSteps } from "@/lib/data/donation";

export function DonationPathTrack({
  step,
  categoryId,
  methodId,
  onJump,
  embedded,
}: {
  step: 1 | 2 | 3;
  categoryId: string;
  methodId: string;
  onJump?: (target: 1 | 2 | 3) => void;
  embedded?: boolean;
}) {
  const category = donationCategories.find((item) => item.id === categoryId);
  const method = donationMethods.find((item) => item.id === methodId);
  const status =
    step === 1
      ? "Step 1 of 3 — choose where your gift can go"
      : step === 2
        ? "Step 2 of 3 — choose how to give"
        : "Step 3 of 3 — thank you";

  return (
    <div
      className={`donation-path donation-path--wizard${embedded ? " donation-path--embedded" : ""}`}
      aria-label="Gift journey progress"
    >
      <div className="donation-path__sticky">
        <p className="donation-path__status">{status}</p>
        <ol className="donation-path__track">
          {donationWizardSteps.map((node, index) => {
            const nodeStep = node.id as 1 | 2 | 3;
            const done = step > nodeStep;
            const current = step === nodeStep;
            const jumpable = Boolean(onJump && nodeStep < step);
            const state = done ? "is-done" : current ? "is-current" : "is-upcoming";
            return (
              <li key={node.id} className="donation-path__track-item">
                {index > 0 ? (
                  <span
                    className={`donation-path__connector ${done || current ? "is-filled" : ""}`}
                    aria-hidden="true"
                  />
                ) : null}
                <button
                  type="button"
                  className={`donation-path__node ${state} ${jumpable ? "is-jumpable" : ""}`}
                  disabled={!jumpable}
                  onClick={() => jumpable && onJump?.(nodeStep)}
                >
                  <span className="donation-path__dot" aria-hidden="true" />
                  <span className="donation-path__label">{node.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      {(category || (method && step >= 3)) && step > 1 ? (
        <div className="donation-path__picks">
          <p className="donation-path__picks-label">Locked in so far</p>
          <ul className="donation-path__chips">
            {category ? (
              <li>
                <span className="donation-path__chip">{category.name}</span>
              </li>
            ) : null}
            {method && step >= 3 ? (
              <li>
                <span className="donation-path__chip">{method.name}</span>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
