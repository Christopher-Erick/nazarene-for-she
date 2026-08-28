"use client";

import { useMemo, useState } from "react";
import { categoryOrder, garments, getGarment } from "@/lib/data/shop";
import { PieceCard } from "@/components/shop/PieceCard";

export function AtelierTable() {
  const [family, setFamily] = useState("all");
  const [query, setQuery] = useState("");

  const rack = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return garments.filter((item) => {
      if (family !== "all" && item.slug !== family) return false;
      if (!needle) return true;
      return [item.name, item.verb, item.lure, item.summary, item.slug].some((value) =>
        value.toLowerCase().includes(needle),
      );
    });
  }, [family, query]);

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
          <p id="rack-filter-label">Filter by</p>
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

      <p className="atelier-edit__meta">
        {rack.length === 0 ? (
          "No pieces match that search."
        ) : chosen && !searching ? (
          <>
            Showing <strong>{chosen.name}</strong>
          </>
        ) : (
          <>
            Showing <strong>{rack.length}</strong> {rack.length === 1 ? "piece" : "pieces"}
            {searching ? " matching your search" : ""}
          </>
        )}
      </p>

      {rack.length === 0 ? (
        <p className="atelier-edit__hint">Try another word, or choose All pieces.</p>
      ) : (
        <div className="piece-grid">
          {rack.map((item, index) => (
            <PieceCard key={item.slug} garment={item} index={index} variant="preview" />
          ))}
        </div>
      )}

      <p className="atelier-look-note">
        Price is confirmed when the organisation replies. Placeholder images show workshop cloth
        and tools, not a specific piece already sewn for sale.
      </p>
    </section>
  );
}
