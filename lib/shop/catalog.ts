import { categoryOrder, cloths, garments, stillFor, stillForGarment, workshopStills, type ClothId, type Garment, type StillId } from "@/lib/data/shop";
import { formatSku, skuPrefix } from "@/lib/shop/sku";
import type { ShopCategory, ShopProduct } from "@/lib/shop/types";

export const CATEGORY_SINGULAR: Record<string, string> = {
  dress: "Dress",
  skirt: "Skirt",
  blouse: "Blouse",
  palazzo: "Palazzo",
  kimono: "Kimono",
  "crop-top": "Crop top",
  jumpsuit: "Jumpsuit",
  uniform: "Uniform",
  trouser: "Trouser",
  jacket: "Jacket",
  sweater: "Sweater",
  tote: "Tote bag",
  kitenge: "Kitenge",
  cap: "Cap",
};

/** Starting workshop prices in Kenyan shillings. Admin can change these. */
export const DEFAULT_PRODUCT_PRICES: Record<string, number> = {
  dress: 4500,
  skirt: 3200,
  blouse: 2800,
  palazzo: 3500,
  kimono: 3800,
  "crop-top": 2200,
  jumpsuit: 4800,
  uniform: 4200,
  trouser: 3400,
  jacket: 5000,
  sweater: 3000,
  tote: 1500,
  kitenge: 2500,
  cap: 800,
};

export const DEFAULT_STOCK = 8;
export const ALL_CLOTH_IDS = cloths.map((cloth) => cloth.id);

export function categoryFromGarment(garment: Garment, id = `atelier-${garment.slug}`): ShopCategory {
  return {
    id,
    slug: garment.slug,
    name: garment.name,
    eyebrow: garment.eyebrow,
    verb: garment.verb,
    summary: garment.summary,
    lure: garment.lure,
    explanation: garment.explanation,
    sizing: garment.sizing,
    still: garment.still,
    visual: garment.visual,
    sortOrder: 0,
  };
}

export function staticCategories(): ShopCategory[] {
  return garments.map((garment) => categoryFromGarment(garment));
}

export function productNameFor(categorySlug: string, categoryName: string) {
  return `${CATEGORY_SINGULAR[categorySlug] ?? categoryName.replace(/s$/, "")} from the workshop`;
}

export function staticProductFor(category: ShopCategory, n = 1): ShopProduct {
  return {
    id: `product-${category.slug}-${String(n).padStart(2, "0")}`,
    categoryId: category.id,
    categorySlug: category.slug,
    categoryName: category.name,
    sku: formatSku(skuPrefix(category.slug), n),
    name: productNameFor(category.slug, category.name),
    slug: `${category.slug}-from-workshop`,
    summary: category.summary,
    description: category.explanation,
    priceKes: DEFAULT_PRODUCT_PRICES[category.slug] ?? 2500,
    stock: DEFAULT_STOCK,
    image: category.visual ?? "",
    sizing: category.sizing,
    cloths: [...ALL_CLOTH_IDS],
    status: "published",
    sortOrder: 0,
  };
}

export function staticProducts(): ShopProduct[] {
  return staticCategories().map((category) => staticProductFor(category));
}

export function parseCloths(value: unknown): ClothId[] {
  const allowed = new Set(ALL_CLOTH_IDS);
  const list = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(value) as unknown;
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];
  const cloths = list.filter((item): item is ClothId => typeof item === "string" && allowed.has(item as ClothId));
  return cloths.length ? cloths : [...ALL_CLOTH_IDS];
}

export function productHref(product: Pick<ShopProduct, "categorySlug" | "slug">) {
  return `/shop/${product.categorySlug}/${product.slug}`;
}

export function categoryHref(slug: string) {
  return `/shop/${slug}`;
}

export function stillForProduct(product: ShopProduct, category?: ShopCategory | null) {
  if (product.image) {
    return { src: product.image, alt: `${product.name} from the Kawangware workshop.` };
  }
  if (category) {
    return stillForGarment({
      slug: category.slug,
      still: category.still,
      visual: category.visual,
      name: product.name,
    });
  }
  return stillFor(product.categorySlug);
}

export function categoryRank(slug: string) {
  const index = (categoryOrder as readonly string[]).indexOf(slug);
  return index === -1 ? 1000 : index;
}

export function sortCategories<T extends { slug: string; sortOrder?: number; name?: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    const byKnown = categoryRank(a.slug) - categoryRank(b.slug);
    if (byKnown) return byKnown;
    const byOrder = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    if (byOrder) return byOrder;
    return (a.name ?? a.slug).localeCompare(b.name ?? b.slug);
  });
}

export function sortProducts(products: ShopProduct[]) {
  return [...products].sort((a, b) => {
    const byCategory = categoryRank(a.categorySlug) - categoryRank(b.categorySlug);
    if (byCategory) return byCategory;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name);
  });
}

const workshopStillOrder: StillId[] = ["fabric", "atelier", "thread"];

function rotatingWorkshopStills(primarySrc: string) {
  const start = workshopStillOrder.findIndex((id) => workshopStills[id].src === primarySrc);
  const offset = start >= 0 ? start : 0;
  const ordered = [...workshopStillOrder.slice(offset), ...workshopStillOrder.slice(0, offset)];
  return Array.from({ length: 4 }, (_, index) => workshopStills[ordered[index % ordered.length]!]);
}

export function previewStillsForCategory(category: ShopCategory) {
  const primary = stillForGarment({
    slug: category.slug,
    still: category.still,
    visual: category.visual,
    name: category.name,
  });
  if (category.visual) return [primary];
  return rotatingWorkshopStills(primary.src);
}

export function previewStillsForProduct(product: ShopProduct, category?: ShopCategory | null) {
  if (product.image) return [stillForProduct(product, category)];
  const primary = stillForProduct(product, category);
  return rotatingWorkshopStills(primary.src);
}

export function lowestPriceIn(products: ShopProduct[]) {
  if (!products.length) return null;
  return Math.min(...products.map((item) => item.priceKes));
}
