"use client";

import { useEffect, useMemo, useState } from "react";
import { categoryOrder, garments, getGarment, type Garment } from "@/lib/data/shop";
import { PREVIEW_FRAME_MS, PREVIEW_FRAMES, PieceCard } from "@/components/shop/PieceCard";

const LARGE_BATCH = 8;
const SMALL_BATCH = 3;
const LARGE_BREAKPOINT = 980;

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

function useRackBatchSize() {
  const [batchSize, setBatchSize] = useState(LARGE_BATCH);

  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${LARGE_BREAKPOINT}px)`);
    const update = () => setBatchSize(media.matches ? LARGE_BATCH : SMALL_BATCH);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return batchSize;
}

function ShowcaseRack({ batches, catalog }: { batches: Garment[][]; catalog: Garment[] }) {
  const [batchIndex, setBatchIndex] = useState(0);
  const safeIndex = batches.length ? batchIndex % batches.length : 0;
  const rack = batches[safeIndex] ?? [];

  useEffect(() => {
    setBatchIndex(0);
  }, [batches.length]);

  useEffect(() => {
    if (batches.length < 2) return;
    const timer = window.setInterval(() => {
      setBatchIndex((current) => (current + 1) % batches.length);
    }, PREVIEW_FRAME_MS * PREVIEW_FRAMES);
    return () => window.clearInterval(timer);
  }, [batches.length]);

  return (
    <>
      <p className="atelier-edit__meta">
        Previewing <strong>{rack.length}</strong> of <strong>{catalog.length}</strong> pieces
        {batches.length > 1 ? (
          <>
            {" "}
            · set <strong>{safeIndex + 1}</strong> of <strong>{batches.length}</strong>
          </>
        ) : null}
      </p>
      <div className="piece-grid" data-showcase="true" aria-live="polite">
        {rack.map((item) => (
          <PieceCard key={item.slug} garment={item} variant="preview" />
        ))}
      </div>
    </>
  );
}

export function AtelierTable() {
  const [family, setFamily] = useState("all");
  const [query, setQuery] = useState("");
  const batchSize = useRackBatchSize();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return garments.filter((item) => {
      if (family !== "all" && item.slug !== family) return false;
      if (!needle) return true;
      return [item.name, item.verb, item.lure, item.summary, item.slug].some((value) =>
        value.toLowerCase().includes(needle),
      );
    });
  }, [family, query]);

  const showcase = family === "all" && !query.trim();

  const catalog = useMemo(
    () =>
      categoryOrder
        .map((slug) => getGarment(slug))
        .filter((item): item is Garment => Boolean(item)),
    [],
  );

  const batches = useMemo(() => chunk(catalog, batchSize), [catalog, batchSize]);
  const chosen = family === "all" ? null : getGarment(family);
  const searching = Boolean(query.trim());

  return (
    <section id="lookbook" className="atelier-edit">
      <h2 className="eyebrow text-accent">The rack</h2>

      <div className="rack-tools">
        <div className="rack-tools__search">
          <label htmlFor="rack-search">Search</label>
          <div className="rack-tools__field">
            <span className="rack-tools__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.75" />
                <path
                  d="M16.2 16.2 20 20"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <input
              id="rack-search"
              type="search"
              value={query}
              placeholder="Search for a piece, e.g. dresses or totes"
              autoComplete="off"
              onChange={(event) => setQuery(event.target.value)}
            />
            {searching ? (
              <button type="button" className="rack-tools__clear" onClick={() => setQuery("")}>
                Clear
              </button>
            ) : null}
          </div>
        </div>

        <div className="rack-tools__filters">
          <label className="rack-tools__filter-label" htmlFor="rack-family">
            Filter by
          </label>
          <select
            id="rack-family"
            className="rack-tools__select"
            value={family}
            onChange={(event) => setFamily(event.target.value)}
          >
            <option value="all">All pieces</option>
            {categoryOrder.map((slug) => {
              const item = getGarment(slug);
              if (!item) return null;
              return (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              );
            })}
          </select>
          <p id="rack-filter-label" className="rack-tools__filter-heading">
            Filter by
          </p>
          <div className="rack-tools__list" role="group" aria-labelledby="rack-filter-label">
            <button
              type="button"
              aria-pressed={family === "all"}
              className="rack-chip"
              onClick={() => setFamily("all")}
            >
              All pieces
            </button>
            {categoryOrder.map((slug) => {
              const item = getGarment(slug);
              if (!item) return null;
              return (
                <button
                  key={item.slug}
                  type="button"
                  aria-pressed={family === item.slug}
                  className="rack-chip"
                  onClick={() => setFamily(item.slug)}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showcase ? (
        <ShowcaseRack batches={batches} catalog={catalog} />
      ) : (
        <>
          <p className="atelier-edit__meta">
            {filtered.length === 0 ? (
              "No pieces match that search."
            ) : chosen && !searching ? (
              <>
                Showing <strong>{chosen.name}</strong>
              </>
            ) : (
              <>
                Showing <strong>{filtered.length}</strong>{" "}
                {filtered.length === 1 ? "piece" : "pieces"}
                {searching ? " matching your search" : ""}
              </>
            )}
          </p>
          {filtered.length === 0 ? (
            <p className="atelier-edit__hint">Try another word, or choose All pieces.</p>
          ) : (
            <div className="piece-grid">
              {filtered.map((item) => (
                <PieceCard key={item.slug} garment={item} variant="preview" />
              ))}
            </div>
          )}
        </>
      )}

      <p className="atelier-look-note">
        Price is confirmed when the organisation replies. Placeholder images show workshop cloth
        and tools, not a specific piece already sewn for sale.
      </p>
    </section>
  );
}
