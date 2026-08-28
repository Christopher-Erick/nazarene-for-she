"use client";

import Image from "next/image";
import { ThreadMark } from "@/components/ui/ThreadMark";
import { shop } from "@/lib/data/shop";

export function AtelierHero() {
  return (
    <header className="atelier-hero bleed-hero">
      <div className="atelier-hero-layer">
        <Image
          src="/images/atmosphere-atelier.webp"
          alt="Tailoring table with gold thread, scissors, measuring tape and folded purple fabric."
          fill
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          className="object-cover object-[center_42%]"
        />
      </div>
      <div className="atelier-hero-veil" />
      <div className="grain" />
      <svg className="atelier-hero-stitch" viewBox="0 0 1200 80" fill="none" aria-hidden="true">
        <path
          d="M0 44C120 18 220 62 340 36C460 10 560 70 700 32C840 -6 960 58 1200 24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="6 10"
        />
      </svg>

      <div className="atelier-hero-copy">
        <p className="eyebrow text-accent">{shop.kicker}</p>
        <h1 className="display-lg mt-3 max-w-4xl text-ivory">
          Wear what she <ThreadMark>made</ThreadMark>.
        </h1>
        <p className="atelier-hero-cta">
          {shop.cta} <strong>{shop.ctaLine}</strong>
        </p>
      </div>
    </header>
  );
}
