"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { analyticsEvents, trackEvent } from "@/lib/analytics";
import {
  cloths,
  fitLabels,
  fitsFor,
  getCloth,
  stillFor,
  workshopStills,
  type ClothId,
  type Garment,
  type GarmentFit,
  type StillId,
} from "@/lib/data/shop";
import { holdPiece, updatePiece, useAtelierBundle } from "@/components/shop/useAtelierBundle";

const workshopStillOrder: StillId[] = ["fabric", "atelier", "thread"];
const PREVIEW_FRAMES = 4;
const PREVIEW_FRAME_MS = 4500;

function previewStillsFor(garment: Garment) {
  const primary = stillFor(garment.slug);
  const start = workshopStillOrder.findIndex((id) => workshopStills[id].src === primary.src);
  const offset = start >= 0 ? start : 0;
  const ordered = [...workshopStillOrder.slice(offset), ...workshopStillOrder.slice(0, offset)];

  return Array.from({ length: PREVIEW_FRAMES }, (_, index) => workshopStills[ordered[index % ordered.length]!]);
}

function PieceCardPreviewFrames({
  garment,
  stills,
}: {
  garment: Garment;
  stills: ReturnType<typeof previewStillsFor>;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (stills.length < 2) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % stills.length);
    }, PREVIEW_FRAME_MS);
    return () => window.clearInterval(timer);
  }, [stills.length]);

  const still = stills[active] ?? stillFor(garment.slug);

  return (
    <Link
      href={`/shop/${garment.slug}`}
      className="piece-card__link"
      aria-label={`${garment.name}. ${still.alt}. ${garment.lure}`}
    >
      <div className="piece-card__media relative">
        <Image
          key={`${garment.slug}-${active}`}
          src={still.src}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 25vw"
          className="object-cover piece-card__frame is-visible"
        />
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
  );
}

function PieceCardPreview({ garment }: { garment: Garment }) {
  const stills = useMemo(() => previewStillsFor(garment), [garment]);

  return (
    <article className="piece-card piece-card--preview" id={`piece-${garment.slug}`}>
      <PieceCardPreviewFrames key={garment.slug} garment={garment} stills={stills} />
    </article>
  );
}

function PieceCardFull({ garment, index }: { garment: Garment; index?: number }) {
  const { items } = useAtelierBundle();
  const heldItem = items.find((item) => item.slug === garment.slug);
  const [cloth, setCloth] = useState<ClothId | null>(null);
  const [fit, setFit] = useState<GarmentFit | null>(null);
  const selectedCloth = cloth ?? heldItem?.cloth ?? null;
  const selectedFit = fit ?? heldItem?.fit ?? null;
  const chosen = selectedCloth ? getCloth(selectedCloth) : null;
  const sizes = fitsFor(garment);
  const ready = Boolean(selectedCloth && selectedFit);
  const number = index != null ? String(index + 1).padStart(2, "0") : null;
  const still = stillFor(garment.slug);

  function chooseCloth(id: ClothId) {
    setCloth(id);
    if (heldItem) updatePiece(garment.slug, { cloth: id });
  }

  function chooseFit(value: GarmentFit) {
    setFit(value);
    if (heldItem) updatePiece(garment.slug, { fit: value });
  }

  function requestPiece() {
    if (!selectedCloth || !selectedFit) return;
    const status = holdPiece(garment.slug, selectedFit, 1, selectedCloth);
    if (status === "added") {
      trackEvent(analyticsEvents.atelierHeld, {
        slug: garment.slug,
        cloth: selectedCloth,
        fit: selectedFit,
      });
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
            aria-checked={selectedCloth === item.id}
            aria-label={item.name}
            title={item.name}
            className={`shade-swatch ${selectedCloth === item.id ? "is-selected" : ""}`}
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
            aria-checked={selectedFit === value}
            className={`piece-card__size ${selectedFit === value ? "is-selected" : ""}`}
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
    return <PieceCardPreview garment={garment} />;
  }
  return <PieceCardFull garment={garment} index={index} />;
}

export { PREVIEW_FRAME_MS, PREVIEW_FRAMES };
