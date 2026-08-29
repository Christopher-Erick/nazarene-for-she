"use client";

import { useCallback, useSyncExternalStore } from "react";
import { garmentSlugs, type ClothId, type GarmentFit } from "@/lib/data/shop";

export const BUNDLE_KEY = "nfs-atelier-bundle";
export const BUNDLE_EVENT = "nfs-atelier-bundle";
export const BUNDLE_ADDED_EVENT = "nfs-atelier-added";
export const BUNDLE_LIMIT = 6;

export type HoldStatus = "added" | "updated" | "full";
export type HoldNotice = { slug: string; status: HoldStatus };

export type BundleItem = {
  slug: string;
  quantity: number;
  fit: GarmentFit;
  cloth: ClothId;
};

function isFit(value: unknown): value is GarmentFit {
  return value === "s" || value === "m" || value === "l" || value === "os" || value === "custom";
}

function isCloth(value: unknown): value is ClothId {
  return value === "plum" || value === "gold" || value === "ivory" || value === "wax";
}

function parseBundle(raw: string | null): BundleItem[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .flatMap((item): BundleItem[] => {
        if (!item || typeof item !== "object") return [];
        const row = item as Partial<BundleItem>;
        if (!garmentSlugs.includes(row.slug as string) || !isFit(row.fit)) return [];
        if (typeof row.quantity !== "number" || row.quantity < 1 || row.quantity > 3) return [];
        return [
          {
            slug: row.slug as string,
            quantity: row.quantity,
            fit: row.fit,
            cloth: isCloth(row.cloth) ? row.cloth : "plum",
          },
        ];
      })
      .slice(0, BUNDLE_LIMIT);
  } catch {
    return [];
  }
}

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(BUNDLE_EVENT));
}

function emitAdded(notice: HoldNotice) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<HoldNotice>(BUNDLE_ADDED_EVENT, { detail: notice }));
}

export function readBundle(): BundleItem[] {
  if (typeof window === "undefined") return [];
  return parseBundle(window.localStorage.getItem(BUNDLE_KEY));
}

export function writeBundle(items: BundleItem[]) {
  window.localStorage.setItem(BUNDLE_KEY, JSON.stringify(items.slice(0, BUNDLE_LIMIT)));
  invalidateBundleSnapshot();
  emit();
}

export function holdPiece(
  slug: string,
  fit: GarmentFit = "m",
  quantity = 1,
  cloth: ClothId = "plum",
): HoldStatus {
  const items = readBundle();
  const existing = items.find((item) => item.slug === slug);
  if (existing) {
    existing.fit = fit;
    existing.cloth = cloth;
    writeBundle(items);
    emitAdded({ slug, status: "updated" });
    return "updated";
  }
  if (items.length >= BUNDLE_LIMIT) {
    emitAdded({ slug, status: "full" });
    return "full";
  }
  writeBundle([...items, { slug, quantity: Math.min(3, quantity), fit, cloth }]);
  emitAdded({ slug, status: "added" });
  return "added";
}

export function updatePiece(
  slug: string,
  patch: Partial<Pick<BundleItem, "quantity" | "fit" | "cloth">>,
) {
  writeBundle(readBundle().map((item) => (item.slug === slug ? { ...item, ...patch } : item)));
}

export function releasePiece(slug: string) {
  writeBundle(readBundle().filter((item) => item.slug !== slug));
}

export function clearBundle() {
  writeBundle([]);
}

export function bundleCount(items: BundleItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

const EMPTY_BUNDLE: BundleItem[] = [];
let bundleSnapshotCache: { raw: string | null; items: BundleItem[] } | null = null;

function invalidateBundleSnapshot() {
  bundleSnapshotCache = null;
}

function getBundleSnapshot(): BundleItem[] {
  if (typeof window === "undefined") return EMPTY_BUNDLE;
  const raw = window.localStorage.getItem(BUNDLE_KEY);
  if (bundleSnapshotCache?.raw === raw) return bundleSnapshotCache.items;
  const items = parseBundle(raw);
  bundleSnapshotCache = { raw, items };
  return items;
}

function subscribeBundle(onStoreChange: () => void) {
  window.addEventListener(BUNDLE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(BUNDLE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function useAtelierBundle() {
  const items = useSyncExternalStore(subscribeBundle, getBundleSnapshot, () => EMPTY_BUNDLE);

  const refresh = useCallback(() => {
    emit();
  }, []);

  return { items, refresh };
}
