"use client";

import { useState } from "react";
import { transformationModel } from "@/lib/data/impact";
import { Reveal } from "@/components/experience/Reveal";
import { cn } from "@/lib/cn";

export function TransformationSection() {
  const [active, setActive] = useState(0);

  return (
    <section className="bg-plum text-ivory">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal>
          <p className="section-kicker text-accent">
            <b>10</b>
            What transformation looks like
          </p>
          <h2 className="display-lg mt-5 max-w-4xl">A model of holistic empowerment — not a single script.</h2>
          <p className="mt-6 max-w-2xl text-ivory/70">
            Not every girl walks this path in the same order, or at the same pace. Choose a step.
          </p>
        </Reveal>
        <ol className="mt-14 divide-y divide-white/10">
          {transformationModel.map((step, index) => (
            <li key={step.id}>
              <button
                type="button"
                className={cn("transform-row", active === index && "is-active")}
                aria-pressed={active === index}
                onClick={() => setActive(index)}
                onMouseEnter={() => setActive(index)}
              >
                <span className="eyebrow text-accent md:col-span-2">0{index + 1}</span>
                <h3 className="font-display text-3xl md:col-span-3">{step.title}</h3>
                <p className="text-ivory/75 md:col-span-7">{step.body}</p>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
