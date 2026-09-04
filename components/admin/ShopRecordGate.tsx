"use client";

import { useEffect, useState } from "react";
import { CategoryEditor } from "@/components/admin/CategoryEditor";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { adminFetch } from "@/components/admin/adminFetch";

export function ShopRecordGate({ id }: { id: string }) {
  const [kind, setKind] = useState<"loading" | "product" | "category" | "missing">("loading");
  const [resolvedId, setResolvedId] = useState(id);
  const shown = resolvedId === id ? kind : "loading";

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      try {
        await adminFetch(`/api/v1/admin/shop/products/${id}`);
        if (!cancelled) {
          setKind("product");
          setResolvedId(id);
        }
        return;
      } catch {
        // Not a product — try the category record next.
      }
      try {
        await adminFetch(`/api/v1/admin/content/atelier/${id}`);
        if (!cancelled) {
          setKind("category");
          setResolvedId(id);
        }
      } catch {
        if (!cancelled) {
          setKind("missing");
          setResolvedId(id);
        }
      }
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (shown === "loading") return <p className="admin-loading">Loading this shop record…</p>;
  if (shown === "product") return <ProductEditor id={id} />;
  if (shown === "category") return <CategoryEditor id={id} />;
  return <p className="admin-flash admin-flash--error">That piece or category is not on the shop.</p>;
}
