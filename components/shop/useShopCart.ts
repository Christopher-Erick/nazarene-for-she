"use client";

import { useCallback, useSyncExternalStore } from "react";
import { isSlug } from "@/lib/cms/sanitize";
import { type ClothId, type GarmentFit } from "@/lib/data/shop";
import type { ShopProduct } from "@/lib/shop/types";

export const CART_KEY = "nfs-shop-cart";
export const CART_EVENT = "nfs-shop-cart";
export const CART_ADDED_EVENT = "nfs-shop-added";
export const CART_LIMIT = 12;
export const CART_QTY_MAX = 10;

export type CartStatus = "added" | "updated" | "full" | "soldout";
export type CartNotice = { productId: string; name: string; status: CartStatus };

export type CartItem = {
  productId: string;
  categorySlug: string;
  slug: string;
  name: string;
  sku: string;
  priceKes: number;
  image: string;
  quantity: number;
  fit: GarmentFit;
  cloth: ClothId;
  sizing: "body" | "one";
};

function isFit(value: unknown): value is GarmentFit {
  return value === "s" || value === "m" || value === "l" || value === "os" || value === "custom";
}

function isCloth(value: unknown): value is ClothId {
  return value === "plum" || value === "gold" || value === "ivory" || value === "wax";
}

function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .flatMap((item): CartItem[] => {
        if (!item || typeof item !== "object") return [];
        const row = item as Partial<CartItem>;
        if (typeof row.productId !== "string" || row.productId.length < 8) return [];
        if (typeof row.slug !== "string" || !isSlug(row.slug) || !isFit(row.fit) || !isCloth(row.cloth)) {
          return [];
        }
        if (typeof row.quantity !== "number" || row.quantity < 1 || row.quantity > CART_QTY_MAX) return [];
        if (typeof row.priceKes !== "number" || row.priceKes < 0) return [];
        return [
          {
            productId: row.productId,
            categorySlug: typeof row.categorySlug === "string" ? row.categorySlug : "",
            slug: row.slug,
            name: typeof row.name === "string" ? row.name : "Piece",
            sku: typeof row.sku === "string" ? row.sku : "",
            priceKes: Math.round(row.priceKes),
            image: typeof row.image === "string" ? row.image : "",
            quantity: row.quantity,
            fit: row.fit,
            cloth: row.cloth,
            sizing: row.sizing === "one" ? "one" : "body",
          },
        ];
      })
      .slice(0, CART_LIMIT);
  } catch {
    return [];
  }
}

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_EVENT));
}

function emitAdded(notice: CartNotice) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<CartNotice>(CART_ADDED_EVENT, { detail: notice }));
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  return parseCart(window.localStorage.getItem(CART_KEY));
}

export function writeCart(items: CartItem[]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items.slice(0, CART_LIMIT)));
  invalidateCartSnapshot();
  emit();
}

function lineKey(item: Pick<CartItem, "productId" | "fit" | "cloth">) {
  return `${item.productId}:${item.fit}:${item.cloth}`;
}

export function addToCart(
  product: ShopProduct,
  fit: GarmentFit,
  cloth: ClothId,
  quantity = 1,
): CartStatus {
  if (product.stock <= 0) {
    emitAdded({ productId: product.id, name: product.name, status: "soldout" });
    return "soldout";
  }
  const items = readCart();
  const existing = items.find(
    (item) => item.productId === product.id && item.fit === fit && item.cloth === cloth,
  );
  const nextQty = Math.min(CART_QTY_MAX, product.stock, (existing?.quantity ?? 0) + quantity);
  if (existing) {
    existing.quantity = nextQty;
    existing.priceKes = product.priceKes;
    existing.name = product.name;
    existing.sku = product.sku;
    writeCart(items);
    emitAdded({ productId: product.id, name: product.name, status: "updated" });
    return "updated";
  }
  if (items.length >= CART_LIMIT) {
    emitAdded({ productId: product.id, name: product.name, status: "full" });
    return "full";
  }
  writeCart([
    ...items,
    {
      productId: product.id,
      categorySlug: product.categorySlug,
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      priceKes: product.priceKes,
      image: product.image,
      quantity: Math.min(CART_QTY_MAX, product.stock, quantity),
      fit,
      cloth,
      sizing: product.sizing,
    },
  ]);
  emitAdded({ productId: product.id, name: product.name, status: "added" });
  return "added";
}

export function updateCartLine(
  productId: string,
  fit: GarmentFit,
  cloth: ClothId,
  patch: Partial<Pick<CartItem, "quantity" | "fit" | "cloth">>,
) {
  writeCart(
    readCart().map((item) =>
      item.productId === productId && item.fit === fit && item.cloth === cloth
        ? { ...item, ...patch, quantity: Math.min(CART_QTY_MAX, Math.max(1, patch.quantity ?? item.quantity)) }
        : item,
    ),
  );
}

export function removeCartLine(productId: string, fit: GarmentFit, cloth: ClothId) {
  writeCart(
    readCart().filter(
      (item) => !(item.productId === productId && item.fit === fit && item.cloth === cloth),
    ),
  );
}

export function clearCart() {
  writeCart([]);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.priceKes * item.quantity, 0);
}

const EMPTY_CART: CartItem[] = [];
let cartSnapshotCache: { raw: string | null; items: CartItem[] } | null = null;

function invalidateCartSnapshot() {
  cartSnapshotCache = null;
}

function getCartSnapshot(): CartItem[] {
  if (typeof window === "undefined") return EMPTY_CART;
  const raw = window.localStorage.getItem(CART_KEY);
  if (cartSnapshotCache?.raw === raw) return cartSnapshotCache.items;
  const items = parseCart(raw);
  cartSnapshotCache = { raw, items };
  return items;
}

function subscribeCart(onStoreChange: () => void) {
  window.addEventListener(CART_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(CART_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function useShopCart() {
  const items = useSyncExternalStore(subscribeCart, getCartSnapshot, () => EMPTY_CART);
  const refresh = useCallback(() => {
    emit();
  }, []);
  return { items, refresh, count: cartCount(items), subtotal: cartSubtotal(items) };
}

export { lineKey };
