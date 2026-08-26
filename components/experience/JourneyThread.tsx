"use client";

import { motion, useScroll, useSpring } from "motion/react";

export function JourneyThread() {
  const { scrollYProgress } = useScroll();
  const pathLength = useSpring(scrollYProgress, { stiffness: 48, damping: 20, mass: 0.35 });

  return (
    <svg
      className="pointer-events-none fixed top-0 left-[2.2%] z-40 hidden h-full w-10 lg:block"
      viewBox="0 0 40 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M20 0 C 28 18, 12 32, 20 48 C 30 64, 11 78, 20 100"
        fill="none"
        stroke="rgba(196,122,44,0.18)"
        strokeWidth="1.15"
      />
      <motion.path
        d="M20 0 C 28 18, 12 32, 20 48 C 30 64, 11 78, 20 100"
        fill="none"
        stroke="#c47a2c"
        strokeWidth="1.35"
        strokeLinecap="round"
        style={{ pathLength }}
      />
    </svg>
  );
}
