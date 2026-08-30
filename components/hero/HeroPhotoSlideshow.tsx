"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const heroSlides = [
  {
    src: "/images/library/pad-distribution1.jpg",
    alt: "Girls receiving sanitary pad distribution support from Nazarene for She in the community.",
    position: "78% 42%",
  },
  {
    src: "/images/library/pad-distribution2.jpg",
    alt: "Pad distribution day — dignity kits and menstrual health support reaching girls in need.",
    position: "68% 32%",
  },
] as const;

const SLIDE_MS = 3000;

export function HeroPhotoSlideshow() {
  const [active, setActive] = useState(0);
  const [motionOk, setMotionOk] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setMotionOk(!media.matches);
    syncMotion();
    media.addEventListener("change", syncMotion);
    return () => media.removeEventListener("change", syncMotion);
  }, []);

  useEffect(() => {
    if (!motionOk || heroSlides.length < 2) return;
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % heroSlides.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [motionOk]);

  return (
    <div className="hero-slideshow" aria-live="off">
      {heroSlides.map((slide, index) => {
        const isActive = index === active;
        return (
          <div
            key={slide.src}
            className={`hero-slideshow__slide ${isActive ? "is-active" : ""}`}
            aria-hidden={!isActive}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={index === 0}
              quality={92}
              sizes="100vw"
              className="hero-slideshow__photo object-cover"
              style={{ objectPosition: slide.position }}
            />
          </div>
        );
      })}
      <div className="hero-slideshow__scrims" aria-hidden="true" />
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
    </div>
  );
}
