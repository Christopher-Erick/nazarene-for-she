import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkoutSchema } from "./checkout.ts";

describe("checkoutSchema", () => {
  it("accepts a cart checkout", () => {
    const parsed = checkoutSchema.parse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      items: [{ productId: "product-dress-01", quantity: 1, fit: "m", cloth: "gold" }],
    });
    assert.equal(parsed.items[0]?.productId, "product-dress-01");
    assert.equal(parsed.items[0]?.cloth, "gold");
    assert.equal(parsed.channel, "web");
  });

  it("requires a phone number for WhatsApp orders", () => {
    const result = checkoutSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      channel: "whatsapp",
      items: [{ productId: "product-dress-01", quantity: 1, fit: "m", cloth: "gold" }],
    });
    assert.equal(result.success, false);
  });

  it("accepts a WhatsApp checkout with a phone number", () => {
    const parsed = checkoutSchema.parse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "0712345678",
      channel: "whatsapp",
      items: [{ productId: "product-dress-01", quantity: 1, fit: "m", cloth: "gold" }],
    });
    assert.equal(parsed.channel, "whatsapp");
    assert.equal(parsed.phone, "0712345678");
  });

  it("rejects an empty cart", () => {
    const result = checkoutSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      items: [],
    });
    assert.equal(result.success, false);
  });

  it("rejects a malformed product id", () => {
    const result = checkoutSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      items: [{ productId: "x", quantity: 1, fit: "m", cloth: "plum" }],
    });
    assert.equal(result.success, false);
  });
});
