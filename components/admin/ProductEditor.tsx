"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { adminFetch } from "@/components/admin/adminFetch";
import { useAdminList } from "@/components/admin/useAdminContent";
import { cloths } from "@/lib/data/shop";
import { sortCategories } from "@/lib/shop/catalog";
import { formatKes } from "@/lib/shop/money";
import type { ShopProduct } from "@/lib/shop/types";

export function ProductEditor({ id }: { id: string }) {
  const categories = useAdminList("atelier");
  const [item, setItem] = useState<ShopProduct | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminFetch(`/api/v1/admin/shop/products/${id}`)
      .then((data) => {
        const next = data.item as ShopProduct;
        setItem(next);
        setCategoryId(next.categoryId);
      })
      .catch((err: Error) => setError(err.message));
  }, [id]);

  const categoryOptions = useMemo(() => {
    if (!item) return [];
    const rows = categories.items.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.title,
      sortOrder: Number(category.payload.sortOrder ?? 0),
    }));
    if (!rows.some((row) => row.id === item.categoryId)) {
      rows.unshift({
        id: item.categoryId,
        slug: item.categorySlug,
        name: item.categoryName || "Current category",
        sortOrder: -1,
      });
    }
    return sortCategories(rows);
  }, [categories.items, item]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item) return;
    const form = new FormData(event.currentTarget);
    const selectedCloths = cloths.map((cloth) => cloth.id).filter((clothId) => form.get(`cloth-${clothId}`) === "on");
    setBusy(true);
    setError("");
    try {
      const data = await adminFetch(`/api/v1/admin/shop/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          categoryId: categoryId || item.categoryId,
          name: form.get("name"),
          slug: form.get("slug"),
          summary: form.get("summary"),
          description: form.get("description"),
          priceKes: form.get("priceKes"),
          stock: form.get("stock"),
          image: form.get("image"),
          sizing: form.get("sizing"),
          cloths: selectedCloths,
          status: form.get("status"),
          sortOrder: form.get("sortOrder"),
        }),
      });
      setItem(data.item as ShopProduct);
      setCategoryId((data.item as ShopProduct).categoryId);
      setMessage("Saved. Visitors see published pieces on the rack.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  if (error && !item) return <p className="admin-flash admin-flash--error">{error}</p>;
  if (!item) return <p className="admin-loading">Loading this piece…</p>;

  return (
    <div className="admin-stack">
      <Link className="admin-back" href="/admin/shop">
        ← Back to the shop
      </Link>
      <AdminHeader
        kicker="Shop piece"
        title={item.name}
        previewHref={item.status === "published" ? `/shop/${item.categorySlug}/${item.slug}` : undefined}
      >
        <p>
          SKU {item.sku} is assigned automatically and cannot be edited. Changing price or stock
          changes what visitors see immediately after you save a published piece.
        </p>
      </AdminHeader>
      {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}
      {message ? <p className="admin-flash admin-flash--ok">{message}</p> : null}
      <p className="admin-note">
        {item.sku} · {formatKes(item.priceKes)} · {item.stock} on the rack
      </p>
      <form className="admin-form admin-form-wide" onSubmit={onSubmit}>
        <label>
          Piece name
          <input name="name" defaultValue={item.name} required />
        </label>
        <label>
          Address on the site
          <input name="slug" defaultValue={item.slug} required />
        </label>
        <label>
          Category
          <select
            name="categoryId"
            value={categoryId || item.categoryId}
            disabled={!categories.loaded}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            {!categories.loaded ? (
              <option value={item.categoryId}>{item.categoryName || "Loading categories…"}</option>
            ) : (
              categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))
            )}
          </select>
        </label>
        <label>
          Shown on the site
          <select name="status" defaultValue={item.status}>
            <option value="draft">Draft — not on the site</option>
            <option value="published">Published — on the rack</option>
            <option value="archived">Off the rack</option>
          </select>
        </label>
        <label>
          Price (KSh)
          <input name="priceKes" type="number" min={0} step={1} defaultValue={item.priceKes} required />
        </label>
        <label>
          How many on the rack
          <input name="stock" type="number" min={0} step={1} defaultValue={item.stock} required />
        </label>
        <label>
          Sizing
          <select name="sizing" defaultValue={item.sizing}>
            <option value="body">Body sizes (S, M, L, custom)</option>
            <option value="one">One size (and custom)</option>
          </select>
        </label>
        <label>
          Order on the rack
          <input name="sortOrder" type="number" min={0} max={999} defaultValue={item.sortOrder} />
        </label>
        <fieldset className="admin-fieldset admin-span-2">
          <legend>Cloth visitors can choose</legend>
          <div className="admin-check-list">
            {cloths.map((cloth) => (
              <label key={cloth.id} className="admin-check">
                <input
                  type="checkbox"
                  name={`cloth-${cloth.id}`}
                  defaultChecked={item.cloths.includes(cloth.id)}
                />
                {cloth.name}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="admin-span-2">
          Summary
          <textarea name="summary" rows={2} defaultValue={item.summary} />
        </label>
        <label className="admin-span-2">
          Description
          <textarea name="description" rows={6} defaultValue={item.description} />
        </label>
        <label className="admin-span-2">
          Photograph
          <input name="image" defaultValue={item.image} placeholder="/images/atmosphere-atelier.webp or a Media library URL" />
        </label>
        <button className="btn btn-plum" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save piece"}
        </button>
      </form>
    </div>
  );
}
