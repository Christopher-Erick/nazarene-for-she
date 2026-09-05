"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { libraryImages } from "@/lib/data/library-images";

const heroSlides = [
  {
    id: "distribution-handoff",
    src: libraryImages.padDistribution1,
    alt: "Girls receiving sanitary pad distribution support from Nazarene for She in the community.",
  },
  {
    id: "distribution-group",
    src: libraryImages.padDistribution2,
    alt: "Pad distribution day — dignity kits and menstrual health support reaching girls in need.",
  },
] as const;

const SLIDE_MS = 7000;

export function HeroPhotoSlideshow() {
  const [active, setActive] = useState(0);
  const [secondaryReady, setSecondaryReady] = useState(false);

  useEffect(() => {
    if (heroSlides.length < 2) return;
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % heroSlides.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const preloadSecond = () => setSecondaryReady(true);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(preloadSecond, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = globalThis.setTimeout(preloadSecond, 1500);
    return () => globalThis.clearTimeout(id);
  }, []);

  return (
    <>
      <div className="hero-photo-wrap">
        <div className="hero-slideshow" aria-live="off">
          {heroSlides.map((slide, index) => {
            const isActive = index === active;
            const shouldRender = index === 0 || secondaryReady || isActive;
            if (!shouldRender) return null;

            return (
              <div
                key={slide.src}
                data-slide={slide.id}
                className={`hero-slideshow__slide ${isActive ? "is-active" : ""}`}
                aria-hidden={!isActive}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  priority={index === 0}
                  loading={index === 0 ? "eager" : "lazy"}
                  quality={index === 0 ? 75 : 70}
                  sizes="100vw"
                  className="hero-slideshow__photo object-cover"
                />
              </div>
            );
          })}
          <div className="hero-slideshow__scrims" aria-hidden="true" />
        </div>
      </div>
      <div className="hero-slideshow__dots" role="tablist" aria-label="Hero photos">
        {heroSlides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            role="tab"
            aria-selected={index === active}
            aria-label={`Show photo ${index + 1} of ${heroSlides.length}`}
            className={`hero-slideshow__dot ${index === active ? "is-active" : ""}`}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
    </>
  );
}
