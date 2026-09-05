"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ProductBuyBox, ProductCard, productStills } from "@/components/shop/ProductCard";
import { productHref, catalogStill, stillForProduct } from "@/lib/shop/catalog";
import type { ShopCategory, ShopProduct } from "@/lib/shop/types";
import { site } from "@/lib/data/site";
import { escapeJsonForScript } from "@/lib/security";

export function ShopProductView({
  product,
  category,
  related = [],
  backHref,
  backLabel,
}: {
  product: ShopProduct;
  category?: ShopCategory | null;
  related?: ShopProduct[];
  backHref: string;
  backLabel: string;
}) {
  const router = useRouter();
  const stills = useMemo(() => productStills(product, category), [product, category]);
  const [active, setActive] = useState(0);
  const still = stills[active] ?? stillForProduct(product, category);
  const shareUrl = `${site.url}${productHref(product)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.description || product.summary,
    brand: { "@type": "NGO", name: site.name },
    offers: {
      "@type": "Offer",
      priceCurrency: "KES",
      price: product.priceKes,
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: shareUrl,
    },
  };

  return (
    <div className="shop-floor">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonForScript(jsonLd) }}
      />
      <article className="shop-pdp">
        <div className="shop-pdp__gallery">
          <div className="shop-pdp__main">
            <Image
              src={still.src}
              alt={still.alt}
              fill
              priority
              sizes="(max-width: 719px) 100vw, 50vw"
              quality={75}
            />
          </div>
          {stills.length > 1 ? (
            <div className="shop-pdp__thumbs" role="list">
              {stills.map((item, index) => (
                <button
                  key={`${item.src}-${index}`}
                  type="button"
                  className={`shop-pdp__thumb${index === active ? " is-active" : ""}`}
                  aria-label={`View image ${index + 1}`}
                  onClick={() => setActive(index)}
                >
                  <Image src={catalogStill(item.src, "chip")} alt="" fill sizes="72px" quality={75} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="shop-pdp__info">
          <ProductBuyBox
            product={product}
            category={category}
            onBuyNow={() => router.push("/shop/checkout")}
          />
          <div className="shop-pdp__share" aria-label="Share">
            <span className="field-label">Share</span>
            <a href={`https://wa.me/?text=${encodeURIComponent(`${product.name} ${shareUrl}`)}`} target="_blank" rel="noopener noreferrer">
              Share on WhatsApp
            </a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">
              Facebook
            </a>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(product.name)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">
              X
            </a>
          </div>
          <div className="shop-pdp__buttons">
            <Link className="btn btn-ghost" href={backHref}>
              {backLabel}
            </Link>
            <Link className="btn btn-plum" href="/shop/checkout">
              Checkout
            </Link>
          </div>
        </div>
      </article>

      {related.length ? (
        <section className="shop-related">
          <p className="eyebrow">More in {category?.name ?? "this category"}</p>
          <h2 className="shop-related__title">Similar pieces</h2>
          <div className="product-grid">
            {related.map((row) => (
              <ProductCard key={row.id} product={row} category={category} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
