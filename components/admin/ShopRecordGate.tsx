"use client";

import { useEffect, useState } from "react";
import { CategoryEditor } from "@/components/admin/CategoryEditor";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { adminFetch } from "@/components/admin/adminFetch";

export function ShopRecordGate({ id }: { id: string }) {
  const [kind, setKind] = useState<"loading" | "product" | "category" | "missing">("loading");

  useEffect(() => {
    let cancelled = false;
    setKind("loading");

    async function resolve() {
      try {
        await adminFetch(`/api/v1/admin/shop/products/${id}`);
        if (!cancelled) setKind("product");
        return;
      } catch {
        // Not a product — try the category record next.
      }
      try {
        await adminFetch(`/api/v1/admin/content/atelier/${id}`);
        if (!cancelled) setKind("category");
      } catch {
        if (!cancelled) setKind("missing");
      }
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (kind === "loading") return <p>Loading this shop record…</p>;
  if (kind === "product") return <ProductEditor id={id} />;
  if (kind === "category") return <CategoryEditor id={id} />;
  return <p className="admin-flash">That piece or category is not on the shop.</p>;
}
