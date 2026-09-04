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

  if (error && !order) return <p className="admin-flash admin-flash--error">{error}</p>;
  if (!order) return <p className="admin-loading">Loading this order…</p>;

  const actions = NEXT_ACTIONS[order.status] ?? [];

  return (
    <div className="admin-stack">
      <Link className="admin-back" href="/admin/shop">
        ← Back to the shop
      </Link>
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
      {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}

      <div className="admin-metrics admin-metrics--two">
        <article className="admin-metric is-static">
          <span className="admin-metric__label">Customer</span>
          <strong className="admin-metric__value">{order.customerName}</strong>
          <span className="admin-metric__hint">
            {order.customerEmail}
            {order.customerPhone ? ` · ${order.customerPhone}` : ""}
            {order.gift ? " · Gift" : ""}
          </span>
        </article>
        <article className="admin-metric is-static">
          <span className="admin-metric__label">Total</span>
          <strong className="admin-metric__value">{formatKes(order.subtotalKes)}</strong>
          <span className="admin-metric__hint">{new Date(order.createdAt).toLocaleString("en-KE")}</span>
        </article>
      </div>

      <section className="admin-group">
        <div className="admin-section-head">
          <h2 className="font-display">Pieces</h2>
        </div>
        <ul className="admin-group">
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
        <section className="admin-panel">
          <h2 className="font-display">Where it should go</h2>
          <p className="whitespace-pre-wrap">{order.deliveryNotes}</p>
        </section>
      ) : null}
      {order.notes ? (
        <section className="admin-panel">
          <h2 className="font-display">Notes</h2>
          <p className="whitespace-pre-wrap">{order.notes}</p>
        </section>
      ) : null}

      {actions.length ? (
        <div className="admin-workflow">
          <p className="admin-workflow__label">Next step</p>
          <div className="admin-workflow-actions">
            {actions.map((status) => (
              <button
                key={status}
                type="button"
                className={`btn ${status === "cancelled" ? "admin-danger" : "btn-plum"}`}
                disabled={busy}
                onClick={() => setStatus(status)}
              >
                {ACTION_LABELS[status] ?? ORDER_STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
