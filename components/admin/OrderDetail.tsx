"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { adminFetch } from "@/components/admin/adminFetch";
import { formatKes } from "@/lib/shop/money";
import { ORDER_CHANNEL_LABELS, ORDER_STATUS_LABELS, type OrderStatus, type ShopOrder } from "@/lib/shop/types";
import { fitLabels } from "@/lib/data/shop";

const NEXT_ACTIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  placed: ["awaiting_payment", "paid", "cancelled"],
  awaiting_payment: ["paid", "cancelled"],
  paid: ["in_workshop", "cancelled"],
  in_workshop: ["ready", "cancelled"],
  ready: ["fulfilled"],
  fulfilled: [],
  cancelled: [],
};

const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  awaiting_payment: "Waiting for payment",
  paid: "Mark as paid",
  in_workshop: "Start in the workshop",
  ready: "Mark as ready",
  fulfilled: "Mark as fulfilled",
  cancelled: "Cancel and return stock",
};

export function OrderDetail({ id }: { id: string }) {
  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const data = await adminFetch(`/api/v1/admin/shop/orders/${id}`);
    setOrder(data.item as ShopOrder);
  }

  useEffect(() => {
    refresh().catch((err: Error) => setError(err.message));
  }, [id]);

  async function setStatus(status: OrderStatus) {
    if (status === "cancelled" && !confirm("Cancel this order and put the pieces back on the rack?")) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await adminFetch(`/api/v1/admin/shop/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrder(data.item as ShopOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update this order.");
    } finally {
      setBusy(false);
    }
  }

  if (error && !order) return <p className="admin-flash">{error}</p>;
  if (!order) return <p>Loading this order…</p>;

  const actions = NEXT_ACTIONS[order.status] ?? [];

  return (
    <div>
      <p>
        <Link href="/admin/shop">Back to the shop</Link>
      </p>
      <AdminHeader kicker="Shop order" title={order.reference}>
        <p>
          {ORDER_STATUS_LABELS[order.status]} · {ORDER_CHANNEL_LABELS[order.channel]}. Ask the
          customer to use this reference when they pay.
        </p>
        {order.channel === "whatsapp" && order.status === "awaiting_payment" ? (
          <p>
            This WhatsApp order is saved even if the customer never sent the chat. If it was
            abandoned, cancel it to return the pieces to the rack.
          </p>
        ) : null}
      </AdminHeader>
      {error ? <p className="admin-flash mt-4">{error}</p> : null}

      <div className="admin-piece-grid mt-8">
        <article className="admin-piece">
          <p className="eyebrow text-accent">Customer</p>
          <h3 className="font-display text-2xl">{order.customerName}</h3>
          <p className="mt-2 text-sm">{order.customerEmail}</p>
          {order.customerPhone ? <p className="text-sm">{order.customerPhone}</p> : null}
          {order.gift ? <p className="mt-2 text-sm">This is a gift.</p> : null}
        </article>
        <article className="admin-piece">
          <p className="eyebrow text-accent">Total</p>
          <p className="font-display text-4xl">{formatKes(order.subtotalKes)}</p>
          <p className="mt-2 text-sm text-muted">
            {new Date(order.createdAt).toLocaleString("en-KE")}
          </p>
        </article>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-2xl">Pieces</h2>
        <ul className="mt-4 space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="admin-piece">
              <div className="admin-piece-top">
                <p className="font-display text-xl">{item.name}</p>
                <p>{formatKes(item.lineTotalKes)}</p>
              </div>
              <p className="mt-1 text-sm text-muted">
                {item.sku} · {item.quantity} × {fitLabels[item.fit as keyof typeof fitLabels] ?? item.fit} ·{" "}
                {item.cloth} · {item.categoryName}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {order.deliveryNotes ? (
        <section className="mt-8">
          <h2 className="font-display text-2xl">Where it should go</h2>
          <p className="mt-3 whitespace-pre-wrap">{order.deliveryNotes}</p>
        </section>
      ) : null}
      {order.notes ? (
        <section className="mt-8">
          <h2 className="font-display text-2xl">Notes</h2>
          <p className="mt-3 whitespace-pre-wrap">{order.notes}</p>
        </section>
      ) : null}

      {actions.length ? (
        <div className="admin-workflow-actions mt-8">
          {actions.map((status) => (
            <button
              key={status}
              type="button"
              className={`btn ${status === "cancelled" ? "btn-ghost" : "btn-plum"}`}
              disabled={busy}
              onClick={() => setStatus(status)}
            >
              {ACTION_LABELS[status] ?? ORDER_STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
