"use client";

import { useEffect, useRef } from "react";

export function ScrollRibbon() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max <= 0 ? 0 : window.scrollY / max;
      node.style.transform = `scaleX(${progress})`;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed top-0 right-0 left-0 z-[60] h-[2px] origin-left bg-accent"
      style={{ transform: "scaleX(0)" }}
      aria-hidden="true"
    />
  );
}
