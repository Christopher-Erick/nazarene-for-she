"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { WorkflowBar } from "@/components/admin/WorkflowBar";
import { useAdminList, type AdminItem } from "@/components/admin/useAdminContent";
import { adminFetch } from "@/components/admin/adminFetch";
import { formatKes, stockLabel, stockTone } from "@/lib/shop/money";
import { sortCategories, sortProducts } from "@/lib/shop/catalog";
import { ORDER_CHANNEL_LABELS, ORDER_STATUS_LABELS, type OrderStatus, type ShopOrder, type ShopProduct } from "@/lib/shop/types";

type DeskTab = "orders" | "pieces" | "categories" | "stock";

export function ShopDesk() {
  const categories = useAdminList("atelier");
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [tab, setTab] = useState<DeskTab>("pieces");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [adding, setAdding] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);

  async function refreshShop() {
    const [productData, orderData] = await Promise.all([
      adminFetch("/api/v1/admin/shop/products?status=all"),
      adminFetch("/api/v1/admin/shop/orders"),
    ]);
    setProducts((productData.items as ShopProduct[]) ?? []);
    setOrders((orderData.items as ShopOrder[]) ?? []);
    setOpenCount(Number(orderData.open ?? 0));
  }

  useEffect(() => {
    refreshShop().catch((err: Error) => setError(err.message));
  }, []);

  const orderedCategories = useMemo(
    () =>
      sortCategories(
        categories.items.map((category) => ({
          ...category,
          name: category.title,
          sortOrder: Number(category.payload.sortOrder ?? 0),
        })),
      ),
    [categories.items],
  );

  const grouped = useMemo(() => {
    return orderedCategories.map((category) => ({
      category,
      pieces: products.filter((item) => item.categoryId === category.id),
    }));
  }, [orderedCategories, products]);

  const orderedProducts = useMemo(() => sortProducts(products), [products]);

  const lowStock = products.filter((item) => item.status === "published" && item.stock <= 3);

  async function addPiece(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await adminFetch("/api/v1/admin/shop/products", {
        method: "POST",
        body: JSON.stringify({
          categoryId: String(form.get("categoryId") ?? ""),
          name: String(form.get("name") ?? ""),
          summary: String(form.get("summary") ?? ""),
          priceKes: form.get("priceKes"),
          stock: form.get("stock"),
          sizing: String(form.get("sizing") ?? "body"),
        }),
      });
      event.currentTarget.reset();
      setAdding(false);
      setMessage("Draft piece created. Publish it when it should appear on the rack.");
      await refreshShop();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that piece.");
    }
  }

  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await categories.create({
        title: String(form.get("title") ?? ""),
        slug: String(form.get("slug") ?? ""),
        excerpt: String(form.get("summary") ?? ""),
        content: String(form.get("explanation") ?? ""),
        payload: {
          eyebrow: "From the workshop",
          verb: String(form.get("verb") ?? ""),
          lure: String(form.get("lure") ?? ""),
          sizing: String(form.get("sizing") ?? "body"),
          still: "atelier",
        },
      });
      event.currentTarget.reset();
      setAddingCategory(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that category.");
    }
  }

  async function setStock(id: string, stock: number) {
    try {
      await adminFetch(`/api/v1/admin/shop/products/${id}/stock`, {
        method: "PATCH",
        body: JSON.stringify({ stock }),
      });
      await refreshShop();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update stock.");
    }
  }

  return (
    <div>
      <AdminHeader kicker="The workshop" title="Shop" previewHref="/shop">
        <p>
          Categories are what visitors filter by — Dresses, Skirts, Totes, and any you add later.
          Pieces live inside those categories, each with a price, stock, and an automatic SKU.
        </p>
      </AdminHeader>
      {error || categories.error ? <p className="admin-flash mt-4">{error || categories.error}</p> : null}
      {message || categories.message ? (
        <p className="admin-flash mt-4">{message || categories.message}</p>
      ) : null}

      <div className="admin-piece-grid mt-8">
        <button type="button" className="admin-piece admin-piece-link" onClick={() => setTab("orders")}>
          <p className="eyebrow text-accent">Orders</p>
          <p className="font-display text-4xl">{openCount}</p>
          <p className="mt-2 text-sm text-muted">Need attention</p>
        </button>
        <button type="button" className="admin-piece admin-piece-link" onClick={() => setTab("pieces")}>
          <p className="eyebrow text-accent">Pieces</p>
          <p className="font-display text-4xl">{products.length}</p>
          <p className="mt-2 text-sm text-muted">On the rack</p>
        </button>
        <button type="button" className="admin-piece admin-piece-link" onClick={() => setTab("stock")}>
          <p className="eyebrow text-accent">Low stock</p>
          <p className="font-display text-4xl">{lowStock.length}</p>
          <p className="mt-2 text-sm text-muted">Three or fewer left</p>
        </button>
        <button type="button" className="admin-piece admin-piece-link" onClick={() => setTab("categories")}>
          <p className="eyebrow text-accent">Categories</p>
          <p className="font-display text-4xl">{categories.items.length}</p>
          <p className="mt-2 text-sm text-muted">Visitor filters</p>
        </button>
      </div>

      <div className="admin-workflow-actions mt-8">
        {(["orders", "pieces", "stock", "categories"] as DeskTab[]).map((id) => (
          <button
            key={id}
            type="button"
            className={`btn ${tab === id ? "btn-plum" : "btn-ghost"}`}
            onClick={() => setTab(id)}
          >
            {id === "orders"
              ? "Orders"
              : id === "pieces"
                ? "Pieces"
                : id === "stock"
                  ? "Inventory"
                  : "Categories"}
          </button>
        ))}
      </div>

      {tab === "orders" ? <OrderList orders={orders} /> : null}

      {tab === "pieces" ? (
        <section className="mt-8">
          <button className="btn btn-plum" type="button" onClick={() => setAdding((value) => !value)}>
            {adding ? "Cancel" : "Add a piece"}
          </button>
          {adding ? (
            <form className="admin-form admin-form-wide mt-6" onSubmit={addPiece}>
              <label>
                Category
                <select name="categoryId" required defaultValue="">
                  <option value="" disabled>
                    {categories.loaded ? "Choose a category" : "Loading categories…"}
                  </option>
                  {orderedCategories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Piece name
                <input name="name" required placeholder="Ivory wrap dress" />
              </label>
              <label>
                Price (KSh)
                <input name="priceKes" type="number" min={0} step={1} required placeholder="4500" />
              </label>
              <label>
                How many on the rack
                <input name="stock" type="number" min={0} step={1} defaultValue={1} />
              </label>
              <label>
                Sizing
                <select name="sizing" defaultValue="body">
                  <option value="body">Body sizes (S, M, L, custom)</option>
                  <option value="one">One size (and custom)</option>
                </select>
              </label>
              <label className="admin-span-2">
                Short summary
                <textarea name="summary" rows={2} />
              </label>
              <button className="btn btn-plum" type="submit">
                Save as draft
              </button>
            </form>
          ) : null}

          {grouped.map(({ category, pieces }) => (
            <div key={category.id} className="mt-10">
              <div className="admin-piece-top">
                <h2 className="font-display text-2xl">{category.title}</h2>
                <Link className="btn btn-ghost" href={`/admin/shop/category/${category.id}`}>
                  Edit category
                </Link>
              </div>
              <div className="admin-piece-grid mt-4">
                {pieces.length ? (
                  pieces.map((item) => <ProductCard key={item.id} item={item} />)
                ) : (
                  <p className="text-muted">No pieces in this category yet.</p>
                )}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {tab === "stock" ? (
        <section className="mt-8">
          <p className="admin-note">
            Changing the number here is what visitors see as in stock or sold out. Cancelling an
            order puts the pieces back.
          </p>
          <div className="admin-piece-grid mt-6">
            {orderedProducts.map((item) => {
              const tone = stockTone(item.stock);
              return (
                <article key={item.id} className="admin-piece">
                  <p className="eyebrow text-accent">{item.categoryName}</p>
                  <h3 className="font-display text-2xl">{item.name}</h3>
                  <p className="mt-1 text-sm text-muted">{item.sku}</p>
                  <p className={`mt-3 text-sm is-${tone}`}>{stockLabel(item.stock)}</p>
                  <label className="mt-3">
                    On the rack
                    <input
                      type="number"
                      min={0}
                      defaultValue={item.stock}
                      key={`${item.id}-${item.stock}`}
                      onBlur={(event) => {
                        const next = Number(event.target.value);
                        if (Number.isFinite(next) && next !== item.stock) setStock(item.id, next);
                      }}
                    />
                  </label>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {tab === "categories" ? (
        <section className="mt-8">
          <p className="admin-note">
            These names appear as filters on /shop. Add a new one when the workshop starts a new
            kind of piece — not a poetic rack.
          </p>
          <button className="btn btn-plum mt-6" type="button" onClick={() => setAddingCategory((value) => !value)}>
            {addingCategory ? "Cancel" : "Add a category"}
          </button>
          {addingCategory ? (
            <form className="admin-form admin-form-wide mt-6" onSubmit={addCategory}>
              <label>
                Category name
                <input name="title" required placeholder="Aprons" />
              </label>
              <label>
                Address on the site
                <input name="slug" placeholder="apron" />
              </label>
              <label>
                Verb on the card
                <input name="verb" placeholder="Tie" />
              </label>
              <label>
                Default sizing
                <select name="sizing" defaultValue="body">
                  <option value="body">Body sizes</option>
                  <option value="one">One size</option>
                </select>
              </label>
              <label className="admin-span-2">
                Short lure
                <textarea name="lure" rows={2} />
              </label>
              <label className="admin-span-2">
                Summary
                <textarea name="summary" rows={2} />
              </label>
              <label className="admin-span-2">
                What visitors read on the category page
                <textarea name="explanation" rows={4} />
              </label>
              <button className="btn btn-plum" type="submit">
                Save as draft
              </button>
            </form>
          ) : null}
          <div className="admin-piece-grid mt-6">
            {orderedCategories.map((item) => (
              <CategoryCard
                key={item.id}
                item={item}
                count={products.filter((row) => row.categoryId === item.id).length}
                onRemove={() => categories.remove(item.id, item.title)}
                onChanged={categories.refresh}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ProductCard({ item }: { item: ShopProduct }) {
  const tone = stockTone(item.stock);
  return (
    <article className="admin-piece">
      <div className="admin-piece-top">
        <p className="eyebrow text-accent">{item.sku}</p>
        <span className={`admin-status ${item.status === "published" ? "is-live" : "is-off"}`}>
          {item.status === "published" ? "On the site" : item.status === "draft" ? "Draft" : "Off the rack"}
        </span>
      </div>
      <h3 className="font-display text-2xl">{item.name}</h3>
      <p className="mt-2 text-sm text-muted">
        {formatKes(item.priceKes)} · {stockLabel(item.stock)}
      </p>
      <p className={`mt-1 text-sm is-${tone}`}>{item.categoryName}</p>
      <div className="admin-piece-actions">
        <Link className="btn btn-ghost" href={`/admin/shop/piece/${item.id}`}>
          Edit this piece
        </Link>
        {item.status === "published" ? (
          <Link className="btn btn-ghost" href={`/shop/${item.categorySlug}/${item.slug}`} target="_blank" rel="noreferrer">
            Preview
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function CategoryCard({
  item,
  count,
  onRemove,
  onChanged,
}: {
  item: AdminItem;
  count: number;
  onRemove: () => void;
  onChanged: () => void;
}) {
  return (
    <article className="admin-piece">
      <div className="admin-piece-top">
        <p className="eyebrow text-accent">{String(item.payload.verb || "Sew")}</p>
        <StatusBadge status={item.status} />
      </div>
      <h3 className="font-display text-2xl">{item.title}</h3>
      <p className="mt-2 text-sm text-muted">
        {count} {count === 1 ? "piece" : "pieces"} · /shop/{item.slug}
      </p>
      <WorkflowBar type="atelier" id={item.id} status={item.status} onChanged={onChanged} />
      <div className="admin-piece-actions">
        <Link className="btn btn-ghost" href={`/admin/shop/category/${item.id}`}>
          Edit category
        </Link>
        <Link className="btn btn-ghost" href={`/shop/${item.slug}`} target="_blank" rel="noreferrer">
          Preview
        </Link>
        <button className="btn btn-ghost" type="button" onClick={onRemove}>
          Remove
        </button>
      </div>
    </article>
  );
}

function OrderList({ orders }: { orders: ShopOrder[] }) {
  if (!orders.length) {
    return <p className="mt-8 text-muted">No orders yet. They appear here when a visitor checks out.</p>;
  }
  const groups: OrderStatus[] = [
    "awaiting_payment",
    "paid",
    "in_workshop",
    "ready",
    "placed",
    "fulfilled",
    "cancelled",
  ];
  return (
    <div className="mt-8 space-y-8">
      {groups.map((status) => {
        const rows = orders.filter((item) => item.status === status);
        if (!rows.length) return null;
        return (
          <section key={status}>
            <h2 className="font-display text-2xl">{ORDER_STATUS_LABELS[status]}</h2>
            <div className="admin-piece-grid mt-4">
              {rows.map((order) => (
                <Link key={order.id} href={`/admin/shop/order/${order.id}`} className="admin-piece admin-piece-link">
                  <p className="eyebrow text-accent">{order.reference}</p>
                  <h3 className="font-display text-2xl">{order.customerName}</h3>
                  <p className="mt-2 text-sm text-muted">
                    {formatKes(order.subtotalKes)} · {order.items.length}{" "}
                    {order.items.length === 1 ? "line" : "lines"} · {ORDER_CHANNEL_LABELS[order.channel]}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {new Date(order.createdAt).toLocaleString("en-KE")}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
