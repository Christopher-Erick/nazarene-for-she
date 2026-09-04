import type { ShopOrder } from "./types";

function formatKes(amount: number) {
  const value = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  return `KSh ${value.toLocaleString("en-KE")}`;
}

const fitLabels: Record<string, string> = {
  s: "S",
  m: "M",
  l: "L",
  os: "One size",
  custom: "Custom",
};

export function workshopWhatsAppDigits(extra = "") {
  const fromEnv = (process.env.WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
  if (fromEnv.length >= 10) return fromEnv;
  return extra.replace(/\D/g, "");
}

export function isWhatsAppOrderingEnabled(extra = "") {
  return workshopWhatsAppDigits(extra).length >= 10;
}

export function buildWhatsAppOrderMessage(order: ShopOrder) {
  const pieces = order.items.map((item) => {
    const fit = fitLabels[item.fit] ?? item.fit;
    return [
      `- ${item.name} (${item.sku}) × ${item.quantity}`,
      `  Size ${fit} · ${item.cloth} cloth`,
      `  ${formatKes(item.unitPriceKes)} each · ${formatKes(item.lineTotalKes)}`,
    ].join("\n");
  });

  const lines = [
    "Hello Nazarene for She — I would like to place this order.",
    "",
    `Order: ${order.reference}`,
    "Source: WhatsApp (from the shop)",
    "",
    "Pieces:",
    ...pieces,
    "",
    `Total: ${formatKes(order.subtotalKes)}`,
    "",
    "Customer:",
    `Name: ${order.customerName}`,
    `Email: ${order.customerEmail}`,
    `Phone: ${order.customerPhone || "—"}`,
    `Gift: ${order.gift ? "yes" : "no"}`,
  ];

  if (order.deliveryNotes) {
    lines.push("", "Delivery / collection:", order.deliveryNotes);
  }
  if (order.notes) {
    lines.push("", "Notes for the workshop:", order.notes);
  }

  lines.push(
    "",
    "Please confirm this order and how I should pay, using the reference above. Thank you.",
  );

  return lines.join("\n");
}

export function whatsappOrderUrl(order: ShopOrder, extra = "") {
  const digits = workshopWhatsAppDigits(extra);
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(buildWhatsAppOrderMessage(order))}`;
}
