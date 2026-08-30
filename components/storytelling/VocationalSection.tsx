"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/experience/Reveal";
import { cn } from "@/lib/cn";
import { libraryImages } from "@/lib/data/library-images";

const sequence = [
  {
    word: "Thread",
    line: "It begins as a line — a connection, a craft, a chance.",
    image: libraryImages.threading,
    alt: "Thread and tailoring — the start of a craft and a livelihood.",
  },
  {
    word: "Skill",
    line: "Hands learn the machine. Measurement becomes instinct.",
    image: libraryImages.skill,
    alt: "Hands learning tailoring and dressmaking skills at the workshop.",
  },
  {
    word: "Product",
    line: "Fabric becomes clothing she can name as her own work.",
    image: libraryImages.product,
    alt: "A garment she can name as her own work.",
  },
  {
    word: "Income",
    line: "A garment can become a living. A living can become a choice.",
    image: libraryImages.income,
    alt: "Income from work she can name as her own.",
  },
  {
    word: "Independence",
    line: "Not rescue. Capacity — a future she can shape.",
    image: libraryImages.independence,
    alt: "A future she can shape — capacity, not rescue.",
  },
];

export function VocationalSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setActive((index) => (index + 1) % sequence.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <section className="theme-band">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal>
          <p className="section-kicker text-accent">
            <b>08</b>
            Vocational training
          </p>
          <h2 className="display-lg mt-5 max-w-4xl">When the thread becomes a livelihood.</h2>
          <p className="mt-6 max-w-2xl text-lg theme-muted">
            Through practical vocational training in tailoring and dressmaking, girls and young
            women with limited educational or economic opportunities can acquire marketable
            skills for employment or entrepreneurship.
          </p>
        </Reveal>

        <div
          className="relative mt-12 aspect-[3/2] overflow-hidden bg-plum"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <Image
            key={sequence[active].image}
            src={sequence[active].image}
            alt={sequence[active].alt}
            fill
            sizes="(min-width: 1152px) 72rem, 100vw"
            className="library-photo object-cover object-center"
            quality={80}
          />
        </div>
        <div className="vocational-tabs mt-4" role="tablist" aria-label="Vocational path">
          {sequence.map((item, index) => (
            <button
              key={item.word}
              type="button"
              role="tab"
              aria-selected={active === index}
              aria-label={item.word}
              className={cn("vocational-tab", active === index && "is-active")}
              onClick={() => {
                setActive(index);
                setPaused(true);
              }}
            />
          ))}
        </div>

        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {sequence.map((item, index) => (
            <li key={item.word}>
              <button
                type="button"
                className={cn("vocational-step", active === index && "is-active")}
                aria-pressed={active === index}
                onClick={() => {
                  setActive(index);
                  setPaused(true);
                }}
              >
                <p className="eyebrow text-accent">0{index + 1}</p>
                <h3 className="mt-3 font-display text-3xl">{item.word}</h3>
                <p className="mt-3 text-sm theme-muted">{item.line}</p>
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-12 flex flex-wrap gap-3">
          <ButtonLink href="/programs/vocational-training">Discover the craft</ButtonLink>
          <ButtonLink href="/shop" variant="ghost">
            Wear her work
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
