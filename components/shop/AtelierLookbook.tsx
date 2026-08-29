"use client";

import { AtelierRequestForm } from "@/components/shop/AtelierRequestForm";
import { AtelierTable } from "@/components/shop/AtelierTable";
import { garments, shop } from "@/lib/data/shop";

const ticker = [...garments.map((item) => item.name), "Her income"];

export function AtelierLookbook() {
  return (
    <div className="atelier-floor">
      <div className="atelier-ticker" aria-hidden="true">
        <div className="atelier-ticker-track">
          {[...ticker, ...ticker].map((word, index) => (
            <span key={`${word}-${index}`}>
              {word}
              <span className="text-accent/60"> — </span>
            </span>
          ))}
        </div>
      </div>

      <AtelierTable />

      <section className="atelier-path" aria-label="How a purchase becomes income">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="eyebrow text-accent">The exchange</p>
          <h2 className="display-md mt-3">How a purchase becomes income</h2>
          <ol className="atelier-path-steps mt-10">
            {shop.howItWorks.map((item) => (
              <li key={item.step} className="atelier-path-step is-active">
                <span className="eyebrow text-accent">{item.step}</span>
                <span className="mt-3 block font-display text-3xl">{item.title}</span>
                <span className="mt-3 block text-muted">{item.body}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 pt-5 pb-24 sm:px-8 sm:pt-6">
        <AtelierRequestForm />
      </div>
    </div>
  );
}
