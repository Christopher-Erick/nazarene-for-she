"use client";

import { useEffect, useRef, useState } from "react";

const ADVANCE_MS = 5000;
const IDLE_RESUME_MS = 8000;

function cardsOf(row: HTMLElement) {
  return Array.from(row.children) as HTMLElement[];
}

/** The card closest to the middle of the row. */
function nearestIndex(row: HTMLElement) {
  const middle = row.scrollLeft + row.clientWidth / 2;
  let nearest = 0;
  let best = Number.POSITIVE_INFINITY;
  cardsOf(row).forEach((card, index) => {
    const distance = Math.abs(card.offsetLeft + card.clientWidth / 2 - middle);
    if (distance < best) {
      best = distance;
      nearest = index;
    }
  });
  return nearest;
}

function scrollToCard(row: HTMLElement, index: number) {
  const card = cardsOf(row)[index];
  if (!card) return;
  row.scrollTo({ left: card.offsetLeft - (row.clientWidth - card.clientWidth) / 2, behavior: "smooth" });
}

/**
 * On phones the leadership cards sit in one swipeable row (CSS scroll-snap) that advances on its own,
 * so the page does not grow by a screen per person. It pauses while someone touches, hovers or tabs into
 * it, and never moves for people who prefer reduced motion. On wider screens the row is a grid and
 * nothing scrolls, so this does nothing there.
 */
export function LeadershipCarousel({ count, children }: { count: number; children: React.ReactNode }) {
  const rowRef = useRef<HTMLUListElement>(null);
  const pausedUntil = useRef(0);
  const [active, setActive] = useState(0);

  function pause() {
    pausedUntil.current = Date.now() + IDLE_RESUME_MS;
  }

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onScroll = () => setActive(nearestIndex(row));

    const timer = window.setInterval(() => {
      if (reduced.matches || document.hidden || Date.now() < pausedUntil.current) return;
      if (row.scrollWidth <= row.clientWidth + 4) return; // grid layout: nothing to scroll
      scrollToCard(row, (nearestIndex(row) + 1) % count);
    }, ADVANCE_MS);

    row.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearInterval(timer);
      row.removeEventListener("scroll", onScroll);
    };
  }, [count]);

  return (
    <>
      <ul
        ref={rowRef}
        className="leadership__grid"
        data-count={Math.min(count, 3)}
        onPointerDown={pause}
        onPointerEnter={pause}
        onFocus={pause}
        onTouchStart={pause}
        aria-label="Leadership team"
      >
        {children}
      </ul>
      {count > 1 ? (
        <div className="leadership__dots" role="group" aria-label="Choose a leader">
          {Array.from({ length: count }, (_, index) => (
            <button
              key={index}
              type="button"
              className={`leadership__dot${index === active ? " is-active" : ""}`}
              aria-label={`Show leader ${index + 1} of ${count}`}
              aria-current={index === active ? "true" : undefined}
              onClick={() => {
                pause();
                if (rowRef.current) scrollToCard(rowRef.current, index);
              }}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
