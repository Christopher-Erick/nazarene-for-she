"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { useShopCatalog } from "@/components/shop/ShopCatalog";
import { cloths, shop, stillForGarment } from "@/lib/data/shop";
import { categoryHref, sortCategories, sortProducts, stillForProduct } from "@/lib/shop/catalog";
import { formatKes } from "@/lib/shop/money";
import type { ShopCategory, ShopProduct } from "@/lib/shop/types";

const QUICK = [
  { label: "Dresses", slug: "dress" },
  { label: "Kitenge", slug: "kitenge" },
  { label: "Tote bags", slug: "tote" },
  { label: "Uniforms", slug: "uniform" },
] as const;

type SortId = "rack" | "price_asc" | "price_desc" | "name";

function clothSwatchesFor(product: ShopProduct | undefined) {
  if (!product) return cloths.slice(0, 4);
  const allowed = new Set(product.cloths);
  const list = cloths.filter((cloth) => allowed.has(cloth.id));
  return (list.length ? list : cloths).slice(0, 4);
}

function sortFiltered(products: ShopProduct[], sort: SortId) {
  if (sort === "price_asc") return [...products].sort((a, b) => a.priceKes - b.priceKes || a.name.localeCompare(b.name));
  if (sort === "price_desc") return [...products].sort((a, b) => b.priceKes - a.priceKes || a.name.localeCompare(b.name));
  if (sort === "name") return [...products].sort((a, b) => a.name.localeCompare(b.name));
  return sortProducts(products);
}

export function ShopFloor({
  categorySlug = null,
  title = "The workshop",
  showExchange = false,
}: {
  categorySlug?: string | null;
  title?: string;
  showExchange?: boolean;
}) {
  const router = useRouter();
  const { categories, products } = useShopCatalog();
  const catalog = useMemo(() => sortCategories(categories), [categories]);
  const ordered = useMemo(() => sortProducts(products), [products]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortId>("rack");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [priceBounds, setPriceBounds] = useState<{ min: number | null; max: number | null }>({
    min: null,
    max: null,
  });
  const railRef = useRef<HTMLDivElement>(null);

  const chosen = categorySlug ? catalog.find((item) => item.slug === categorySlug) ?? null : null;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const min = priceBounds.min;
    const max = priceBounds.max;
    const pool = chosen ? ordered.filter((item) => item.categorySlug === chosen.slug) : ordered;
    const next = pool.filter((item) => {
      if (min != null && item.priceKes < min) return false;
      if (max != null && item.priceKes > max) return false;
      if (!needle) return true;
      return [item.name, item.summary, item.sku, item.categoryName].some((value) =>
        value.toLowerCase().includes(needle),
      );
    });
    return sortFiltered(next, sort);
  }, [chosen, ordered, priceBounds, query, sort]);

  const spotlight = filtered.find((item) => item.stock > 0) ?? filtered[0] ?? ordered.find((item) => item.stock > 0) ?? null;
  const spotlightCategory = spotlight
    ? catalog.find((item) => item.slug === spotlight.categorySlug) ?? null
    : null;
  const spotlightStill = spotlight ? stillForProduct(spotlight, spotlightCategory) : null;
  const searching = Boolean(query.trim());

  function applyPrice(event: FormEvent) {
    event.preventDefault();
    const min = minPrice.trim() ? Number(minPrice) : null;
    const max = maxPrice.trim() ? Number(maxPrice) : null;
    setPriceBounds({
      min: min != null && Number.isFinite(min) ? Math.max(0, Math.round(min)) : null,
      max: max != null && Number.isFinite(max) ? Math.max(0, Math.round(max)) : null,
    });
  }

  function onCategory(value: string) {
    router.push(value ? categoryHref(value) : shop.path);
  }

  return (
    <div className="shop-floor">
      <section className="shop-layout">
        <div className="shop-sidebar">
          <form className="shop-filters" onSubmit={applyPrice} aria-label="Filters">
            <h1 className="shop-filters__title">{title}</h1>
            <details className="shop-filters__panel" open>
              <summary className="shop-filters__summary">Filters &amp; sort</summary>
              <div className="shop-filters__form">
                <div className="shop-filter">
                  <label className="shop-filter__label" htmlFor="shop-category">
                    Category
                  </label>
                  <select
                    className="shop-filter__select"
                    id="shop-category"
                    value={chosen?.slug ?? ""}
                    onChange={(event) => onCategory(event.target.value)}
                  >
                    <option value="">All categories</option>
                    {catalog.map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="shop-filter">
                  <label className="shop-filter__label" htmlFor="shop-sort">
                    Sort
                  </label>
                  <select
                    className="shop-filter__select"
                    id="shop-sort"
                    value={sort}
                    onChange={(event) => setSort(event.target.value as SortId)}
                  >
                    <option value="rack">Workshop order</option>
                    <option value="price_asc">Price: low to high</option>
                    <option value="price_desc">Price: high to low</option>
                    <option value="name">Name</option>
                  </select>
                </div>

                <div className="shop-filter-row">
                  <div className="shop-filter">
                    <label className="shop-filter__label" htmlFor="min_price">
                      Min price
                    </label>
                    <input
                      className="shop-filter__input"
                      id="min_price"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      value={minPrice}
                      onChange={(event) => setMinPrice(event.target.value)}
                    />
                  </div>
                  <div className="shop-filter">
                    <label className="shop-filter__label" htmlFor="max_price">
                      Max price
                    </label>
                    <input
                      className="shop-filter__input"
                      id="max_price"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      value={maxPrice}
                      onChange={(event) => setMaxPrice(event.target.value)}
                    />
                  </div>
                </div>
                <button className="btn btn-plum" type="submit">
                  Apply
                </button>
              </div>
            </details>
          </form>

          {spotlight && spotlightStill ? (
            <aside className="shop-spotlight" aria-labelledby="shop-spotlight-heading">
              <p className="eyebrow">From the workshop</p>
              <h2 id="shop-spotlight-heading" className="shop-spotlight__heading">
                On the table
              </h2>
              <Link className="shop-spotlight__media" href={`/shop/${spotlight.categorySlug}/${spotlight.slug}`}>
                <Image src={spotlightStill.src} alt={spotlightStill.alt} fill sizes="18.5rem" quality={90} />
                <span className="shop-spotlight__badge">In the workshop</span>
              </Link>
              <h3 className="shop-spotlight__name">
                <Link href={`/shop/${spotlight.categorySlug}/${spotlight.slug}`}>{spotlight.name}</Link>
              </h3>
              <p className="shop-spotlight__note">{spotlight.categoryName}</p>
              <p className="shop-spotlight__price">{formatKes(spotlight.priceKes)}</p>
              <Link className="btn btn-ghost" href={`/shop/${spotlight.categorySlug}/${spotlight.slug}`}>
                See the piece
              </Link>
            </aside>
          ) : null}
        </div>

        <div className="shop-results">
          <form className="shop-search" role="search" onSubmit={(event) => event.preventDefault()}>
            <div className="shop-search__intro">
              <span className="shop-search__spark" aria-hidden="true">
                ✦
              </span>
              <div>
                <p className="shop-search__eyebrow">Find a piece from the workshop</p>
                <p className="shop-search__hint">Search by name, cloth, or category</p>
              </div>
            </div>
            <div className="shop-search__bar">
              <svg className="shop-search__icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 4.3 4.3" />
              </svg>
              <label className="sr-only" htmlFor="shop-q">
                Search products
              </label>
              <input
                className="shop-search__input"
                id="shop-q"
                type="search"
                value={query}
                placeholder="Try “dress”, “kitenge” or “tote”…"
                autoComplete="off"
                onChange={(event) => setQuery(event.target.value)}
              />
              {searching ? (
                <button className="shop-search__clear" type="button" aria-label="Clear search" onClick={() => setQuery("")}>
                  ×
                </button>
              ) : (
                <span />
              )}
              <button className="btn btn-plum shop-search__btn" type="submit">
                Search
              </button>
            </div>
            <div className="shop-search__quick" aria-label="Popular categories">
              <span>Try:</span>
              {QUICK.map((item) => (
                <Link key={item.slug} href={categoryHref(item.slug)}>
                  {item.label}
                </Link>
              ))}
            </div>
          </form>

          {catalog.length ? (
            <section className="shop-mood" aria-labelledby="shop-mood-heading">
              <div className="shop-mood__head">
                <div>
                  <p className="eyebrow">Shop by category</p>
                  <h2 id="shop-mood-heading" className="shop-mood__title">
                    Find a rack
                  </h2>
                </div>
                <p className="shop-mood__hint">Tap a category to open every piece on that rack</p>
              </div>
              <div className="shop-rail">
                <button
                  className="shop-rail__arrow shop-rail__arrow--prev"
                  type="button"
                  aria-label="View previous categories"
                  onClick={() => railRef.current?.scrollBy({ left: -280, behavior: "smooth" })}
                >
                  ‹
                </button>
                <div className="shop-rail__track" role="list" ref={railRef}>
                  {catalog.map((item) => (
                    <MoodChip
                      key={item.id}
                      category={item}
                      products={ordered.filter((row) => row.categorySlug === item.slug)}
                      active={chosen?.slug === item.slug}
                    />
                  ))}
                </div>
                <button
                  className="shop-rail__arrow shop-rail__arrow--next"
                  type="button"
                  aria-label="View more categories"
                  onClick={() => railRef.current?.scrollBy({ left: 280, behavior: "smooth" })}
                >
                  ›
                </button>
              </div>
            </section>
          ) : null}

          <div className="shop-results__meta">
            <p>
              {filtered.length === 0 ? (
                chosen && !searching ? (
                  `Nothing on the ${chosen.name} rack yet.`
                ) : (
                  "No pieces match these filters right now."
                )
              ) : (
                <>
                  Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? "piece" : "pieces"}
                  {chosen ? ` in ${chosen.name}` : ""}
                  {searching ? " matching your search" : ""}
                </>
              )}
            </p>
          </div>

          <div className="product-grid">
            {filtered.length ? (
              filtered.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  category={catalog.find((row) => row.slug === item.categorySlug)}
                />
              ))
            ) : (
              <div className="shop-empty">
                <p className="shop-empty__title">Nothing on this rack yet</p>
                <p>
                  Nothing matches these filters right now. Try dresses, kitenges or totes — or clear the search to browse the
                  full workshop.
                </p>
                <Link className="btn btn-plum" href={shop.path}>
                  Browse the workshop
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {showExchange ? (
        <section className="shop-exchange" aria-label="How a purchase becomes income">
          <p className="eyebrow">The exchange</p>
          <h2 className="shop-exchange__title">How a purchase becomes income</h2>
          <ol className="shop-exchange__steps">
            {shop.howItWorks.map((item) => (
              <li key={item.step} className="shop-exchange__step">
                <span className="eyebrow">{item.step}</span>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8">
            <Link href="/shop/checkout" className="btn btn-plum">
              Go to checkout
            </Link>
          </p>
        </section>
      ) : null}
    </div>
  );
}

function MoodChip({
  category,
  products,
  active,
}: {
  category: ShopCategory;
  products: ShopProduct[];
  active: boolean;
}) {
  const sample = products[0];
  const still = sample
    ? stillForProduct(sample, category)
    : stillForGarment({
        slug: category.slug,
        still: category.still,
        visual: category.visual,
        name: category.name,
      });
  const swatches = clothSwatchesFor(sample);

  return (
    <Link className={`mood-chip${active ? " is-active" : ""}`} href={categoryHref(category.slug)} role="listitem">
      <span className="mood-chip__media" aria-hidden="true">
        <Image src={still.src} alt="" fill sizes="72px" />
      </span>
      <span className="mood-chip__copy">
        <span className="mood-chip__parent">{category.eyebrow}</span>
        <span className="mood-chip__name">{category.name}</span>
        <span className="mood-chip__meta">
          {products.length} {products.length === 1 ? "piece" : "pieces"}
        </span>
      </span>
      <span className="mood-chip__swatches" aria-hidden="true">
        {swatches.map((cloth) => (
          <i key={cloth.id} style={{ "--swatch": cloth.hex } as CSSProperties} />
        ))}
      </span>
    </Link>
  );
}
