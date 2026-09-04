"use client";

import { createContext, useContext, type ReactNode } from "react";
import { staticCategories, staticProducts } from "@/lib/shop/catalog";
import type { ShopCategory, ShopProduct } from "@/lib/shop/types";

type ShopCatalogValue = {
  categories: ShopCategory[];
  products: ShopProduct[];
};

const ShopCatalogContext = createContext<ShopCatalogValue>({
  categories: staticCategories(),
  products: staticProducts(),
});

export function ShopCatalogProvider({
  categories,
  products,
  children,
}: {
  categories: ShopCategory[];
  products: ShopProduct[];
  children: ReactNode;
}) {
  return (
    <ShopCatalogContext.Provider
      value={{
        categories: categories.length ? categories : staticCategories(),
        products,
      }}
    >
      {children}
    </ShopCatalogContext.Provider>
  );
}

export function useShopCatalog() {
  return useContext(ShopCatalogContext);
}

export function useShopProduct(id: string) {
  const { products } = useShopCatalog();
  return products.find((item) => item.id === id) ?? null;
}
