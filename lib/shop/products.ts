import { queryAll, queryFirst, run, newId, nowMs } from "@/lib/cms/db";
import { isSlug, slugify } from "@/lib/cms/sanitize";
import { parseKesInput } from "@/lib/shop/money";
import { parseCloths } from "@/lib/shop/catalog";
import { nextSku } from "@/lib/shop/sku";
import {
  isProductStatus,
  isReservedShopSlug,
  type ProductStatus,
  type ShopProduct,
} from "@/lib/shop/types";

export type ProductRow = {
  id: string;
  category_id: string;
  sku: string;
  name: string;
  slug: string;
  summary: string;
  description: string;
  price_kes: number;
  stock: number;
  image: string;
  sizing: string;
  cloths: string;
  status: string;
  sort_order: number;
  created_at: number;
  updated_at: number;
  published_at: number | null;
  deleted_at: number | null;
  category_slug?: string;
  category_name?: string;
};

export function productFromRow(row: ProductRow): ShopProduct {
  return {
    id: row.id,
    categoryId: row.category_id,
    categorySlug: row.category_slug ?? "",
    categoryName: row.category_name ?? "",
    sku: row.sku,
    name: row.name,
    slug: row.slug,
    summary: row.summary,
    description: row.description,
    priceKes: row.price_kes,
    stock: row.stock,
    image: row.image,
    sizing: row.sizing === "one" ? "one" : "body",
    cloths: parseCloths(row.cloths),
    status: isProductStatus(row.status) ? row.status : "draft",
    sortOrder: row.sort_order,
  };
}

const SELECT = `SELECT p.*, c.slug AS category_slug, c.title AS category_name
  FROM shop_products p
  JOIN content_items c ON c.id = p.category_id
  WHERE p.deleted_at IS NULL`;

export async function listProducts(
  db: D1Database,
  options: { status?: ProductStatus | "all"; categoryId?: string; includeUnlisted?: boolean } = {},
) {
  const clauses = [SELECT];
  const params: unknown[] = [];
  if (options.categoryId) {
    clauses.push("AND p.category_id = ?");
    params.push(options.categoryId);
  }
  if (options.status && options.status !== "all") {
    clauses.push("AND p.status = ?");
    params.push(options.status);
  } else if (!options.includeUnlisted) {
    clauses.push("AND p.status != 'archived'");
  }
  clauses.push("ORDER BY c.title ASC, p.sort_order ASC, p.name ASC");
  return queryAll<ProductRow>(db, clauses.join(" "), ...params);
}

export async function listPublishedProducts(db: D1Database) {
  return queryAll<ProductRow>(
    db,
    `${SELECT} AND p.status = 'published' AND c.status = 'published' AND c.deleted_at IS NULL
     ORDER BY p.sort_order ASC, p.name ASC`,
  );
}

export async function getProduct(db: D1Database, id: string) {
  return queryFirst<ProductRow>(db, `${SELECT} AND p.id = ?`, id);
}

export async function getPublishedProductBySlug(db: D1Database, categorySlug: string, productSlug: string) {
  return queryFirst<ProductRow>(
    db,
    `${SELECT} AND p.status = 'published' AND c.status = 'published' AND c.deleted_at IS NULL
     AND c.slug = ? AND p.slug = ?`,
    categorySlug,
    productSlug,
  );
}

export async function productSlugTaken(db: D1Database, slug: string, exceptId?: string) {
  const row = exceptId
    ? await queryFirst<{ id: string }>(
        db,
        "SELECT id FROM shop_products WHERE slug = ? AND deleted_at IS NULL AND id != ?",
        slug,
        exceptId,
      )
    : await queryFirst<{ id: string }>(
        db,
        "SELECT id FROM shop_products WHERE slug = ? AND deleted_at IS NULL",
        slug,
      );
  return Boolean(row);
}

export type ProductWrite = {
  categoryId: string;
  name: string;
  slug?: string;
  summary?: string;
  description?: string;
  priceKes?: unknown;
  stock?: unknown;
  image?: string;
  sizing?: string;
  cloths?: unknown;
  status?: string;
  sortOrder?: unknown;
};

export async function createProduct(db: D1Database, input: ProductWrite, userId: string | null) {
  const category = await queryFirst<{ id: string; slug: string; title: string; payload: string }>(
    db,
    "SELECT id, slug, title, payload FROM content_items WHERE id = ? AND type = 'atelier' AND deleted_at IS NULL",
    input.categoryId,
  );
  if (!category) throw new Error("Choose a shop category first.");

  const name = String(input.name ?? "").trim().slice(0, 160);
  if (!name) throw new Error("Give this piece a name.");
  const slug = slugify(input.slug || name);
  if (!isSlug(slug) || isReservedShopSlug(slug)) throw new Error("That address cannot be used.");
  if (await productSlugTaken(db, slug)) throw new Error("That address is already in use.");

  const sku = await nextSku(db, category.slug);
  const now = nowMs();
  const status: ProductStatus = input.status === "published" ? "published" : "draft";
  const stock = Math.max(0, Math.floor(Number(input.stock) || 0));
  const id = newId();
  await run(
    db,
    `INSERT INTO shop_products (
      id, category_id, sku, name, slug, summary, description, price_kes, stock, image,
      sizing, cloths, status, sort_order, created_by, updated_by, created_at, updated_at, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    category.id,
    sku,
    name,
    slug,
    String(input.summary ?? "").slice(0, 400),
    String(input.description ?? "").slice(0, 4000),
    parseKesInput(input.priceKes),
    stock,
    String(input.image ?? "").slice(0, 500),
    input.sizing === "one" ? "one" : "body",
    JSON.stringify(parseCloths(input.cloths)),
    status,
    Math.max(0, Math.min(999, Math.round(Number(input.sortOrder) || 0))),
    userId,
    userId,
    now,
    now,
    status === "published" ? now : null,
  );
  return getProduct(db, id);
}

export async function updateProduct(db: D1Database, id: string, input: ProductWrite, userId: string | null) {
  const existing = await getProduct(db, id);
  if (!existing) throw new Error("That piece is not on the rack.");
  const name = String(input.name ?? existing.name).trim().slice(0, 160);
  if (!name) throw new Error("Give this piece a name.");
  const slug = slugify(input.slug || existing.slug);
  if (!isSlug(slug) || isReservedShopSlug(slug)) throw new Error("That address cannot be used.");
  if (await productSlugTaken(db, slug, id)) throw new Error("That address is already in use.");

  let categoryId = existing.category_id;
  if (input.categoryId && input.categoryId !== existing.category_id) {
    const category = await queryFirst<{ id: string }>(
      db,
      "SELECT id FROM content_items WHERE id = ? AND type = 'atelier' AND deleted_at IS NULL",
      input.categoryId,
    );
    if (!category) throw new Error("Choose a shop category first.");
    categoryId = category.id;
  }

  const requested = input.status != null ? String(input.status) : existing.status;
  const status: ProductStatus = isProductStatus(requested)
    ? requested
    : (existing.status as ProductStatus);
  const now = nowMs();
  const publishedAt =
    status === "published" ? (existing.published_at ?? now) : existing.published_at;
  const stock = Math.max(0, Math.floor(Number(input.stock ?? existing.stock)));

  await run(
    db,
    `UPDATE shop_products SET
      category_id = ?, name = ?, slug = ?, summary = ?, description = ?, price_kes = ?, stock = ?,
      image = ?, sizing = ?, cloths = ?, status = ?, sort_order = ?, updated_by = ?, updated_at = ?, published_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
    categoryId,
    name,
    slug,
    String(input.summary ?? existing.summary).slice(0, 400),
    String(input.description ?? existing.description).slice(0, 4000),
    parseKesInput(input.priceKes ?? existing.price_kes),
    stock,
    String(input.image ?? existing.image).slice(0, 500),
    (input.sizing ?? existing.sizing) === "one" ? "one" : "body",
    JSON.stringify(parseCloths(input.cloths ?? existing.cloths)),
    status,
    Math.max(0, Math.min(999, Math.round(Number(input.sortOrder ?? existing.sort_order) || 0))),
    userId,
    now,
    publishedAt,
    id,
  );
  return getProduct(db, id);
}

export async function adjustStock(db: D1Database, id: string, stock: number, userId: string | null) {
  const next = Math.max(0, Math.floor(stock));
  await run(
    db,
    "UPDATE shop_products SET stock = ?, updated_by = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL",
    next,
    userId,
    nowMs(),
    id,
  );
  return getProduct(db, id);
}

export async function archiveProduct(db: D1Database, id: string, userId: string | null) {
  await run(
    db,
    "UPDATE shop_products SET deleted_at = ?, updated_by = ?, updated_at = ?, status = 'archived' WHERE id = ? AND deleted_at IS NULL",
    nowMs(),
    userId,
    nowMs(),
    id,
  );
}
