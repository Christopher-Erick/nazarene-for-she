"use client";

import { useState } from "react";
import { Reveal } from "@/components/experience/Reveal";
import { ThreadMark } from "@/components/ui/ThreadMark";

const choices = [
  { left: "Education", or: "or menstrual hygiene?", and: "and menstrual hygiene." },
  { left: "Dignity", or: "or basic necessities?", and: "and basic necessities." },
  { left: "Opportunity", or: "or survival?", and: "and a future." },
];

export function ChoiceSection() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <section className="bg-plum text-ivory">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal>
          <p className="section-kicker text-accent">
            <b>02</b>
            Why it matters
          </p>
          <h2 className="display-lg mt-5 max-w-4xl">She should never have to make these choices.</h2>
        </Reveal>
        <ul className="mt-14 space-y-0">
          {choices.map((choice) => {
            const on = active === choice.left;
            return (
              <li key={choice.left} className="border-t border-white/10">
                <button
                  type="button"
                  className="choice-row"
                  onMouseEnter={() => setActive(choice.left)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(choice.left)}
                  onBlur={() => setActive(null)}
                  onClick={() => setActive(on ? null : choice.left)}
                  aria-pressed={on}
                >
                  <p className="font-display text-3xl tracking-tight sm:text-5xl">
                    {choice.left}{" "}
                    <span className={on ? "italic text-accent-soft" : "italic text-ivory/45"}>
                      {on ? choice.and : choice.or}
                    </span>
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-10 font-display text-4xl italic text-accent-soft sm:text-6xl">
          She deserves <ThreadMark>both</ThreadMark>.
        </p>
      </div>
    </section>
  );
}
