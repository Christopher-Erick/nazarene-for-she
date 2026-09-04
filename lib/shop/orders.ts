import { queryAll, queryFirst, run, newId, nowMs } from "@/lib/cms/db";
import { getCloth } from "@/lib/data/shop";
import { productFromRow, type ProductRow } from "@/lib/shop/products";
import {
  isOrderChannel,
  isOrderStatus,
  type OrderStatus,
  type ShopOrder,
  type ShopOrderItem,
} from "@/lib/shop/types";
import type { CheckoutInput } from "@/lib/validation/checkout";

type OrderRow = {
  id: string;
  reference: string;
  status: string;
  channel?: string;
  access_key?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  gift: number;
  notes: string;
  delivery_notes: string;
  subtotal_kes: number;
  created_at: number;
  updated_at: number;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  sku: string;
  name: string;
  category_name: string;
  quantity: number;
  unit_price_kes: number;
  fit: string;
  cloth: string;
  line_total_kes: number;
};

function itemFromRow(row: OrderItemRow): ShopOrderItem {
  return {
    id: row.id,
    productId: row.product_id,
    sku: row.sku,
    name: row.name,
    categoryName: row.category_name,
    quantity: row.quantity,
    unitPriceKes: row.unit_price_kes,
    fit: row.fit,
    cloth: row.cloth,
    lineTotalKes: row.line_total_kes,
  };
}

function orderFromRows(row: OrderRow, items: OrderItemRow[]): ShopOrder {
  const channel = row.channel ?? "web";
  return {
    id: row.id,
    reference: row.reference,
    status: isOrderStatus(row.status) ? row.status : "placed",
    channel: isOrderChannel(channel) ? channel : "web",
    accessKey: row.access_key ?? "",
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    gift: row.gift === 1,
    notes: row.notes,
    deliveryNotes: row.delivery_notes,
    subtotalKes: row.subtotal_kes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: items.map(itemFromRow),
  };
}

export async function listOrders(db: D1Database, status?: OrderStatus) {
  const rows = status
    ? await queryAll<OrderRow>(
        db,
        "SELECT * FROM shop_orders WHERE status = ? ORDER BY created_at DESC LIMIT 80",
        status,
      )
    : await queryAll<OrderRow>(db, "SELECT * FROM shop_orders ORDER BY created_at DESC LIMIT 80");
  const limited = rows;
  const items = limited.length
    ? await queryAll<OrderItemRow>(
        db,
        `SELECT * FROM shop_order_items WHERE order_id IN (${limited.map(() => "?").join(",")})`,
        ...limited.map((row) => row.id),
      )
    : [];
  const byOrder = new Map<string, OrderItemRow[]>();
  for (const item of items) {
    const list = byOrder.get(item.order_id) ?? [];
    list.push(item);
    byOrder.set(item.order_id, list);
  }
  return limited.map((row) => orderFromRows(row, byOrder.get(row.id) ?? []));
}

export async function getOrder(db: D1Database, id: string) {
  const row = await queryFirst<OrderRow>(db, "SELECT * FROM shop_orders WHERE id = ?", id);
  if (!row) return null;
  const items = await queryAll<OrderItemRow>(
    db,
    "SELECT * FROM shop_order_items WHERE order_id = ? ORDER BY name ASC",
    id,
  );
  return orderFromRows(row, items);
}

export async function getOrderByReference(db: D1Database, reference: string, accessKey?: string) {
  const row = await queryFirst<OrderRow>(
    db,
    "SELECT * FROM shop_orders WHERE reference = ?",
    reference.toUpperCase(),
  );
  if (!row) return null;
  if (row.access_key && accessKey !== row.access_key) return null;
  return getOrder(db, row.id);
}

function orderAccessKey() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function orderReference() {
  const now = new Date();
  const nairobi = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));
  const stamp = [
    String(nairobi.getFullYear()).slice(2),
    String(nairobi.getMonth() + 1).padStart(2, "0"),
    String(nairobi.getDate()).padStart(2, "0"),
  ].join("");
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const tail = Array.from(bytes, (b) => b.toString(36).toUpperCase())
    .join("")
    .replace(/[^A-Z0-9]/g, "X")
    .slice(0, 4)
    .padEnd(4, "X");
  return `NFS-${stamp}-${tail}`;
}

export type PlaceOrderResult =
  | { ok: true; order: ShopOrder }
  | { ok: false; message: string };

export async function placeOrder(db: D1Database, input: CheckoutInput): Promise<PlaceOrderResult> {
  const lines: Array<{
    product: ReturnType<typeof productFromRow>;
    quantity: number;
    fit: string;
    cloth: string;
    lineTotal: number;
  }> = [];

  const needed = new Map<string, number>();
  for (const item of input.items) {
    needed.set(item.productId, (needed.get(item.productId) ?? 0) + item.quantity);
  }
  const ids = [...needed.keys()];
  const rows = ids.length
    ? await queryAll<ProductRow>(
        db,
        `SELECT p.*, c.slug AS category_slug, c.title AS category_name
         FROM shop_products p
         JOIN content_items c ON c.id = p.category_id
         WHERE p.deleted_at IS NULL AND p.status = 'published'
           AND c.status = 'published' AND c.deleted_at IS NULL
           AND p.id IN (${ids.map(() => "?").join(",")})`,
        ...ids,
      )
    : [];
  const byId = new Map(rows.map((row) => [row.id, productFromRow(row)]));

  for (const item of input.items) {
    const product = byId.get(item.productId);
    if (!product) return { ok: false, message: "One of those pieces is no longer for sale." };
    const required = needed.get(item.productId) ?? item.quantity;
    if (product.stock < required) {
      return {
        ok: false,
        message:
          product.stock <= 0
            ? `${product.name} is sold out.`
            : `Only ${product.stock} of ${product.name} ${product.stock === 1 ? "is" : "are"} left.`,
      };
    }
    if (!product.cloths.includes(item.cloth)) {
      return { ok: false, message: `That cloth is not available for ${product.name}.` };
    }
    lines.push({
      product,
      quantity: item.quantity,
      fit: item.fit,
      cloth: item.cloth,
      lineTotal: product.priceKes * item.quantity,
    });
  }

  const decremented: Array<{ id: string; quantity: number }> = [];
  try {
    const stockNow = nowMs();
    for (const [productId, quantity] of needed) {
      const result = await run(
        db,
        `UPDATE shop_products
         SET stock = stock - ?, updated_at = ?
         WHERE id = ? AND deleted_at IS NULL AND status = 'published' AND stock >= ?`,
        quantity,
        stockNow,
        productId,
        quantity,
      );
      const changed = Number((result as { meta?: { changes?: number } }).meta?.changes ?? 0);
      if (!changed) {
        throw new Error("STOCK");
      }
      decremented.push({ id: productId, quantity });
    }

    const id = newId();
    const now = nowMs();
    let reference = orderReference();
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const taken = await queryFirst<{ id: string }>(
        db,
        "SELECT id FROM shop_orders WHERE reference = ?",
        reference,
      );
      if (!taken) break;
      reference = orderReference();
    }
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const accessKey = orderAccessKey();
    await run(
      db,
      `INSERT INTO shop_orders (
        id, reference, status, channel, access_key, customer_name, customer_email, customer_phone,
        gift, notes, delivery_notes, subtotal_kes, created_at, updated_at
      ) VALUES (?, ?, 'awaiting_payment', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      reference,
      input.channel,
      accessKey,
      input.name,
      input.email,
      input.phone ?? "",
      input.gift ? 1 : 0,
      input.message ?? "",
      input.delivery ?? "",
      subtotal,
      now,
      now,
    );
    for (const line of lines) {
      await run(
        db,
        `INSERT INTO shop_order_items (
          id, order_id, product_id, sku, name, category_name, quantity,
          unit_price_kes, fit, cloth, line_total_kes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        newId(),
        id,
        line.product.id,
        line.product.sku,
        line.product.name,
        line.product.categoryName,
        line.quantity,
        line.product.priceKes,
        line.fit,
        getCloth(line.cloth)?.name ?? line.cloth,
        line.lineTotal,
      );
    }
    const order = await getOrder(db, id);
    if (!order) throw new Error("ORDER");
    return { ok: true, order };
  } catch (error) {
    for (const item of decremented) {
      await run(
        db,
        "UPDATE shop_products SET stock = stock + ?, updated_at = ? WHERE id = ?",
        item.quantity,
        nowMs(),
        item.id,
      ).catch(() => undefined);
    }
    if (error instanceof Error && error.message === "STOCK") {
      return { ok: false, message: "Someone just bought the last of a piece in your cart. Please review quantities." };
    }
    throw error;
  }
}

export async function updateOrderStatus(db: D1Database, id: string, status: OrderStatus) {
  const existing = await getOrder(db, id);
  if (!existing) throw new Error("That order was not found.");
  if (existing.status === status) return existing;
  if (existing.status === "cancelled" && status !== "cancelled") {
    throw new Error("A cancelled order cannot be reopened.");
  }
  if (existing.status === "fulfilled" && status === "cancelled") {
    throw new Error("A fulfilled order cannot be cancelled.");
  }

  if (status === "cancelled" && existing.status !== "cancelled") {
    for (const item of existing.items) {
      if (!item.productId) continue;
      await run(
        db,
        "UPDATE shop_products SET stock = stock + ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL",
        item.quantity,
        nowMs(),
        item.productId,
      );
    }
  }

  await run(
    db,
    "UPDATE shop_orders SET status = ?, updated_at = ? WHERE id = ?",
    status,
    nowMs(),
    id,
  );
  return getOrder(db, id);
}

export async function countOpenOrders(db: D1Database) {
  const row = await queryFirst<{ n: number }>(
    db,
    `SELECT COUNT(*) AS n FROM shop_orders
     WHERE status IN ('placed', 'awaiting_payment', 'paid', 'in_workshop', 'ready')`,
  );
  return row?.n ?? 0;
}
