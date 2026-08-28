"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { analyticsEvents, trackEvent } from "@/lib/analytics";
import {
  cloths,
  fitLabels,
  fitsFor,
  garmentsIn,
  getCloth,
  stillFor,
  type ClothId,
  type Garment,
  type GarmentFit,
} from "@/lib/data/shop";
import { holdPiece, updatePiece, useAtelierBundle } from "@/components/shop/useAtelierBundle";

function previewStillsFor(garment: Garment, cardIndex = 0) {
  const siblings = garmentsIn(garment.collection);
  const start = ((cardIndex % siblings.length) + siblings.length) % siblings.length;
  const ordered = [...siblings.slice(start), ...siblings.slice(0, start)];

  const seen = new Set<string>();
  return ordered
    .map((item) => stillFor(item.slug))
    .filter((still) => {
      if (seen.has(still.src)) return false;
      seen.add(still.src);
      return true;
    });
}

function PieceCardPreview({ garment, index = 0 }: { garment: Garment; index?: number }) {
  const stills = useMemo(() => previewStillsFor(garment, index), [garment, index]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (stills.length < 2) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % stills.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [stills.length]);

  const still = stills[active] ?? stillFor(garment.slug);

  return (
    <article className="piece-card piece-card--preview" id={`piece-${garment.slug}`}>
      <Link
        href={`/shop/${garment.slug}`}
        className="piece-card__link"
        aria-label={`${garment.name}. ${still.alt}. ${garment.lure}`}
      >
        <div className="piece-card__media relative">
          {stills.map((frame, frameIndex) => (
            <Image
              key={frame.src}
              src={frame.src}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 25vw"
              className={`object-cover piece-card__frame ${frameIndex === active ? "is-visible" : ""}`}
            />
          ))}
          <span className="placeholder-chip piece-card__badge">Placeholder</span>
          <span className="piece-card__price-tag" aria-label="Price on request">
            <span className="piece-card__price-tag-hole" aria-hidden="true" />
            <span className="piece-card__price-tag-kicker">Price</span>
            <strong>On request</strong>
          </span>
        </div>
        <div className="piece-card__body">
          <h3 className="piece-card__title">{garment.name}</h3>
          <p className="piece-card__tagline">{garment.lure}</p>
        </div>
      </Link>
    </article>
  );
}

function PieceCardFull({ garment, index }: { garment: Garment; index?: number }) {
  const { items } = useAtelierBundle();
  const heldItem = items.find((item) => item.slug === garment.slug);
  const [cloth, setCloth] = useState<ClothId | null>(null);
  const [fit, setFit] = useState<GarmentFit | null>(null);
  const chosen = cloth ? getCloth(cloth) : null;
  const sizes = fitsFor(garment);
  const ready = Boolean(cloth && fit);
  const number = index != null ? String(index + 1).padStart(2, "0") : null;
  const still = stillFor(garment.slug);

  useEffect(() => {
    if (heldItem?.cloth) setCloth(heldItem.cloth);
    if (heldItem?.fit) setFit(heldItem.fit);
  }, [heldItem?.cloth, heldItem?.fit]);

  function chooseCloth(id: ClothId) {
    setCloth(id);
    if (heldItem) updatePiece(garment.slug, { cloth: id });
  }

  function chooseFit(value: GarmentFit) {
    setFit(value);
    if (heldItem) updatePiece(garment.slug, { fit: value });
  }

  function requestPiece() {
    if (!cloth || !fit) return;
    const status = holdPiece(garment.slug, fit, 1, cloth);
    if (status === "added") {
      trackEvent(analyticsEvents.atelierHeld, { slug: garment.slug, cloth, fit });
    }
  }

  return (
    <article className="piece-card" id={`piece-${garment.slug}`}>
      <Link
        href={`/shop/${garment.slug}`}
        className="piece-card__media relative"
        aria-label={`${garment.name}. ${still.alt}`}
      >
        <Image
          src={still.src}
          alt={still.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 25vw"
          className="object-cover"
        />
        <span className="placeholder-chip piece-card__badge">Placeholder</span>
        <span className="piece-card__price-tag" aria-label="Price on request">
          <span className="piece-card__price-tag-hole" aria-hidden="true" />
          <span className="piece-card__price-tag-kicker">Price</span>
          <strong>On request</strong>
        </span>
      </Link>
      {number ? <span className="piece-card__num">{number}</span> : null}
      <p className="piece-card__verb">{garment.verb}</p>
      <h3 className="piece-card__title">
        <Link href={`/shop/${garment.slug}`}>{garment.name}</Link>
      </h3>
      <p className="piece-card__tagline">{garment.lure}</p>
      <p className="piece-card__price">Price on request</p>
      <p className="piece-card__choose">Cloth</p>
      <div className="piece-card__swatches" role="radiogroup" aria-label={`Cloth for ${garment.name}`}>
        {cloths.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={cloth === item.id}
            aria-label={item.name}
            title={item.name}
            className={`shade-swatch ${cloth === item.id ? "is-selected" : ""}`}
            style={{ "--swatch": item.hex } as CSSProperties}
            onClick={() => chooseCloth(item.id)}
          />
        ))}
      </div>
      <p className="piece-card__shade">{chosen?.name ?? "Choose a cloth"}</p>
      <p className="piece-card__choose">Size</p>
      <div className="piece-card__sizes" role="radiogroup" aria-label={`Size for ${garment.name}`}>
        {sizes.map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={fit === value}
            className={`piece-card__size ${fit === value ? "is-selected" : ""}`}
            onClick={() => chooseFit(value)}
          >
            {fitLabels[value]}
          </button>
        ))}
      </div>
      <div className="piece-card__actions">
        <button
          type="button"
          className={`btn piece-card__cart ${heldItem ? "btn-plum is-held" : "btn-ghost"}`}
          aria-pressed={Boolean(heldItem)}
          disabled={!heldItem && !ready}
          title={
            !heldItem && !ready ? "Choose a cloth and a size to request this piece" : undefined
          }
          onClick={requestPiece}
        >
          {heldItem ? (
            <>
              <span className="piece-card__check" aria-hidden="true">
                ✓
              </span>
              In your request
            </>
          ) : ready ? (
            "Request this piece"
          ) : (
            "Choose cloth and size"
          )}
        </button>
      </div>
    </article>
  );
}

export function PieceCard({
  garment,
  index,
  variant = "full",
}: {
  garment: Garment;
  index?: number;
  variant?: "preview" | "full";
}) {
  if (variant === "preview") {
    return <PieceCardPreview garment={garment} index={index} />;
  }
  return <PieceCardFull garment={garment} index={index} />;
}
