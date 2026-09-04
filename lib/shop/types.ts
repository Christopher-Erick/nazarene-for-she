import type { ClothId, GarmentFit } from "@/lib/data/shop";

export const PRODUCT_STATUSES = ["draft", "published", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const ORDER_STATUSES = [
  "placed",
  "awaiting_payment",
  "paid",
  "in_workshop",
  "ready",
  "fulfilled",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "New order",
  awaiting_payment: "Waiting for payment",
  paid: "Paid",
  in_workshop: "In the workshop",
  ready: "Ready",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

export const ORDER_CHANNELS = ["web", "whatsapp"] as const;
export type OrderChannel = (typeof ORDER_CHANNELS)[number];

export const ORDER_CHANNEL_LABELS: Record<OrderChannel, string> = {
  web: "Website",
  whatsapp: "WhatsApp",
};

export type ShopCategory = {
  id: string;
  slug: string;
  name: string;
  eyebrow: string;
  verb: string;
  summary: string;
  lure: string;
  explanation: string;
  sizing: "body" | "one";
  still?: "fabric" | "atelier" | "thread";
  visual?: string;
  sortOrder: number;
};

export type ShopProduct = {
  id: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  sku: string;
  name: string;
  slug: string;
  summary: string;
  description: string;
  priceKes: number;
  stock: number;
  image: string;
  sizing: "body" | "one";
  cloths: ClothId[];
  status: ProductStatus;
  sortOrder: number;
};

export type CartLine = {
  productId: string;
  quantity: number;
  fit: GarmentFit;
  cloth: ClothId;
};

export type ShopOrderItem = {
  id: string;
  productId: string | null;
  sku: string;
  name: string;
  categoryName: string;
  quantity: number;
  unitPriceKes: number;
  fit: string;
  cloth: string;
  lineTotalKes: number;
};

export type ShopOrder = {
  id: string;
  reference: string;
  status: OrderStatus;
  channel: OrderChannel;
  accessKey: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  gift: boolean;
  notes: string;
  deliveryNotes: string;
  subtotalKes: number;
  createdAt: number;
  updatedAt: number;
  items: ShopOrderItem[];
};

export const RESERVED_SHOP_SLUGS = ["checkout", "cart", "order", "lookbook", "request"] as const;

export function isReservedShopSlug(slug: string) {
  return (RESERVED_SHOP_SLUGS as readonly string[]).includes(slug);
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function isOrderChannel(value: string): value is OrderChannel {
  return (ORDER_CHANNELS as readonly string[]).includes(value);
}

export function isProductStatus(value: string): value is ProductStatus {
  return (PRODUCT_STATUSES as readonly string[]).includes(value);
}
