import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildWhatsAppOrderMessage, whatsappOrderUrl } from "./whatsapp.ts";
import type { ShopOrder } from "./types.ts";

const order: ShopOrder = {
  id: "order-1",
  reference: "NFS-260904-AB12",
  status: "awaiting_payment",
  channel: "whatsapp",
  accessKey: "",
  customerName: "Ada Lovelace",
  customerEmail: "ada@example.com",
  customerPhone: "0712345678",
  gift: false,
  notes: "Soft waist if possible.",
  deliveryNotes: "Collect in Kawangware.",
  subtotalKes: 3200,
  createdAt: 0,
  updatedAt: 0,
  items: [
    {
      id: "line-1",
      productId: "product-skirt-01",
      sku: "NFS-SKIRT-0001",
      name: "Skirt from the workshop",
      categoryName: "Skirts",
      quantity: 1,
      unitPriceKes: 3200,
      fit: "m",
      cloth: "Plum",
      lineTotalKes: 3200,
    },
  ],
};

describe("buildWhatsAppOrderMessage", () => {
  it("includes reference, pieces, totals, and customer details", () => {
    const message = buildWhatsAppOrderMessage(order);
    assert.match(message, /NFS-260904-AB12/);
    assert.match(message, /Skirt from the workshop/);
    assert.match(message, /NFS-SKIRT-0001/);
    assert.match(message, /Size M/);
    assert.match(message, /KSh 3,200/);
    assert.match(message, /Ada Lovelace/);
    assert.match(message, /ada@example.com/);
    assert.match(message, /0712345678/);
    assert.match(message, /Collect in Kawangware/);
    assert.match(message, /Soft waist/);
    assert.match(message, /Source: WhatsApp/);
  });

  it("builds a wa.me url when a workshop number is set", () => {
    const previous = process.env.WHATSAPP_NUMBER;
    process.env.WHATSAPP_NUMBER = "254712345678";
    try {
      const url = whatsappOrderUrl(order);
      assert.ok(url);
      assert.match(url, /^https:\/\/wa\.me\/254712345678\?text=/);
      assert.match(decodeURIComponent(url.split("text=")[1] ?? ""), /NFS-260904-AB12/);
    } finally {
      if (previous === undefined) delete process.env.WHATSAPP_NUMBER;
      else process.env.WHATSAPP_NUMBER = previous;
    }
  });
});
