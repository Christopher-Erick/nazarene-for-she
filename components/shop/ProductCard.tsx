"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { analyticsEvents, trackEvent } from "@/lib/analytics";
import { cloths, fitLabels, fitsForSizing, getCloth, stillForGarment, type ClothId, type GarmentFit } from "@/lib/data/shop";
import {
  categoryHref,
  lowestPriceIn,
  previewStillsForCategory,
  previewStillsForProduct,
  productHref,
  stillForProduct,
} from "@/lib/shop/catalog";
import { formatKes, stockLabel, stockTone } from "@/lib/shop/money";
import type { ShopCategory, ShopProduct } from "@/lib/shop/types";
import { useShopCatalog } from "@/components/shop/ShopCatalog";
import { addToCart, useShopCart } from "@/components/shop/useShopCart";

export const PREVIEW_FRAMES = 4;
export const PREVIEW_FRAME_MS = 4500;
const CARD_IMAGE_SIZES = "(max-width: 379px) 100vw, (max-width: 639px) 50vw, (max-width: 899px) 33vw, 22vw";

function clothsFor(product: ShopProduct) {
  const allowed = new Set(product.cloths);
  const list = cloths.filter((cloth) => allowed.has(cloth.id));
  return list.length ? list : [...cloths];
}

function useResolvedCategory(product: ShopProduct, category?: ShopCategory | null) {
  const catalog = useShopCatalog();
  return category ?? catalog.categories.find((item) => item.slug === product.categorySlug) ?? null;
}

export function CategoryPreviewCard({
  category,
  products = [],
}: {
  category: ShopCategory;
  products?: ShopProduct[];
}) {
  const stills = useMemo(() => previewStillsForCategory(category), [category]);
  const [active, setActive] = useState(0);
  const href = categoryHref(category.slug);
  const fromPrice = lowestPriceIn(products.filter((item) => item.categorySlug === category.slug));
  const count = products.filter((item) => item.categorySlug === category.slug).length;

  useEffect(() => {
    if (stills.length < 2) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % stills.length);
    }, PREVIEW_FRAME_MS);
    return () => window.clearInterval(timer);
  }, [stills.length]);

  const still = stills[stills.length ? active % stills.length : 0] ?? stillForGarment(category);

  return (
    <article className="shop-card" id={`piece-${category.slug}`}>
      <Link href={href} className="shop-card__media" aria-label={`${category.name}. ${count} ${count === 1 ? "piece" : "pieces"} on this rack.`}>
        <Image
          key={`${category.id}-${active}`}
          src={still.src}
          alt=""
          fill
          sizes={CARD_IMAGE_SIZES}
          quality={90}
        />
      </Link>
      <div className="shop-card__body">
        <p className="shop-card__tagline">{fromPrice == null ? "Pieces" : `From ${formatKes(fromPrice)}`}</p>
        <h3 className="shop-card__title">
          <Link href={href}>{category.name}</Link>
        </h3>
        <p className="shop-card__shade">{category.lure}</p>
      </div>
    </article>
  );
}

export function ProductCard({
  product,
  category,
}: {
  product: ShopProduct;
  category?: ShopCategory | null;
  variant?: "preview" | "full";
  index?: number;
}) {
  const resolved = useResolvedCategory(product, category);
  const href = productHref(product);
  const still = stillForProduct(product, resolved);
  const { items } = useShopCart();
  const held = items.filter((item) => item.productId === product.id);
  const palette = clothsFor(product);
  const sizes = fitsForSizing(product.sizing);
  const [cloth, setCloth] = useState<ClothId | null>(null);
  const [fit, setFit] = useState<GarmentFit | null>(product.sizing === "one" ? "os" : null);
  const chosen = cloth ? getCloth(cloth) : null;
  const soldOut = product.stock <= 0;
  const inCart = held.length > 0;
  const ready = Boolean(cloth && fit);
  const tone = stockTone(product.stock);
  const badge = soldOut ? "Sold out" : tone === "low" ? `Only ${product.stock} left` : null;
  const cartLabel = soldOut
    ? "Sold out"
    : !cloth
      ? "Choose a cloth"
      : !fit
        ? "Choose a size"
        : inCart
          ? "Add another"
          : "Add to cart";

  function add() {
    if (!cloth || !fit || soldOut) return;
    const status = addToCart(product, fit, cloth, 1);
    if (status === "added" || status === "updated") {
      trackEvent(analyticsEvents.atelierHeld, { slug: product.slug, cloth, fit });
    }
  }

  return (
    <article className={`shop-card${tone === "low" ? " shop-card--low" : ""}`} id={`piece-${product.slug}`}>
      <Link href={href} className="shop-card__media" aria-label={`${product.name}. ${formatKes(product.priceKes)}.`}>
        {badge ? <span className={`shop-card__badge${tone === "low" ? " shop-card__badge--pulse" : ""}`}>{badge}</span> : null}
        <Image src={still.src} alt={still.alt} fill sizes={CARD_IMAGE_SIZES} quality={90} />
      </Link>
      <div className="shop-card__body">
        <p className="shop-card__tagline">{resolved?.name ?? product.categoryName}</p>
        <h3 className="shop-card__title">
          <Link href={href}>{product.name}</Link>
        </h3>
        <p className="shop-card__price">{formatKes(product.priceKes)}</p>
        <div className="shop-card__swatches" role="radiogroup" aria-label={`Cloth for ${product.name}`}>
          {palette.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={cloth === item.id}
              aria-label={item.name}
              title={item.name}
              className={`shade-swatch${cloth === item.id ? " is-selected" : ""}`}
              style={{ "--swatch": item.hex } as CSSProperties}
              onClick={() => setCloth(item.id)}
            />
          ))}
        </div>
        <p className="shop-card__shade">{chosen?.name ?? "Choose a cloth"}</p>
        {product.sizing === "body" ? (
          <div className="shop-card__sizes" role="radiogroup" aria-label={`Size for ${product.name}`}>
            {sizes.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={fit === value}
                className={`shop-card__size${fit === value ? " is-selected" : ""}`}
                onClick={() => setFit(value)}
              >
                {fitLabels[value]}
              </button>
            ))}
          </div>
        ) : null}
        <div className="shop-card__actions">
          <button
            type="button"
            className={`btn shop-card__cart ${inCart ? "btn-plum" : "btn-ghost"}`}
            disabled={soldOut || !ready}
            aria-label={cartLabel}
            onClick={add}
          >
            <svg className="shop-card__cart-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6.5 8.5h11l-1 10.2a1.5 1.5 0 0 1-1.5 1.3H9a1.5 1.5 0 0 1-1.5-1.3L6.5 8.5Z" />
              <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
            </svg>
            <span className="shop-card__cart-label">{cartLabel}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductBuyBox({
  product,
  category,
  onBuyNow,
}: {
  product: ShopProduct;
  category?: ShopCategory | null;
  onBuyNow?: () => void;
}) {
  const palette = useMemo(() => clothsFor(product), [product]);
  const sizes = fitsForSizing(product.sizing);
  const [cloth, setCloth] = useState<ClothId | null>(null);
  const [fit, setFit] = useState<GarmentFit | null>(product.sizing === "one" ? "os" : null);
  const [quantity, setQuantity] = useState(1);
  const soldOut = product.stock <= 0;
  const tone = stockTone(product.stock);
  const ready = Boolean(cloth && fit);

  function add(buyNow = false) {
    if (!cloth || !fit || soldOut) return;
    const status = addToCart(product, fit, cloth, quantity);
    if (status === "added" || status === "updated") {
      trackEvent(analyticsEvents.atelierHeld, { slug: product.slug, cloth, fit });
      if (buyNow) onBuyNow?.();
    }
  }

  return (
    <div className="shop-pdp__buy">
      <p className="eyebrow">{category?.name ?? product.categoryName}</p>
      <p className={`shop-card__shade ${tone === "out" ? "is-out" : ""}`}>{stockLabel(product.stock)} — from the Kawangware workshop</p>
      <h1 className="shop-pdp__title">{product.name}</h1>
      <p className="shop-pdp__price">{formatKes(product.priceKes)}</p>
      {product.summary ? <p className="shop-pdp__intro">{product.summary}</p> : null}
      <p className="shop-pdp__sku">{product.sku}</p>

      {product.description ? (
        <div className="shop-pdp__details">
          <section>
            <h2>Description</h2>
            <p>{product.description}</p>
          </section>
        </div>
      ) : null}

      <p className="field-label">Cloth</p>
      <div className="shop-pdp__swatches" role="radiogroup" aria-label="Cloth">
        {palette.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={cloth === item.id}
            aria-label={item.name}
            className={`shade-swatch shade-swatch--lg${cloth === item.id ? " is-selected" : ""}`}
            style={{ "--swatch": item.hex } as CSSProperties}
            onClick={() => setCloth(item.id)}
          />
        ))}
        <span className="shop-pdp__shade">{cloth ? getCloth(cloth)?.name : "Choose a cloth"}</span>
      </div>

      <p className="field-label">Size</p>
      <div className="shop-pdp__sizes" role="radiogroup" aria-label="Size">
        {sizes.map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={fit === value}
            className={`shop-card__size${fit === value ? " is-selected" : ""}`}
            onClick={() => setFit(value)}
          >
            {fitLabels[value]}
          </button>
        ))}
      </div>

      <div className="shop-pdp__qty">
        <label className="field-label" htmlFor="qty">
          Quantity
        </label>
        <input
          className="shop-pdp__qty-field"
          id="qty"
          type="number"
          min={1}
          max={Math.max(1, product.stock)}
          value={quantity}
          onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
        />
      </div>

      <div className="shop-pdp__buttons">
        <button className="btn btn-plum" type="button" disabled={soldOut || !ready} onClick={() => add(false)}>
          {soldOut ? "Sold out" : !cloth ? "Choose a cloth" : !fit ? "Choose a size" : "Add to cart"}
        </button>
        <button className="btn btn-ghost" type="button" disabled={soldOut || !ready} onClick={() => add(true)}>
          Buy now
        </button>
      </div>
    </div>
  );
}

export function productStills(product: ShopProduct, category?: ShopCategory | null) {
  return previewStillsForProduct(product, category);
}
