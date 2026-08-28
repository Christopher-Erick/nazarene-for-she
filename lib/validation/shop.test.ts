import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shopRequestSchema } from "./shop.ts";

describe("shopRequestSchema", () => {
  it("accepts a made-to-order request", () => {
    const parsed = shopRequestSchema.parse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      message: "Please make a dress for a Sunday service.",
      items: [{ slug: "dress", quantity: 1, fit: "m" }],
    });
    assert.equal(parsed.gift, false);
    assert.equal(parsed.items[0]?.slug, "dress");
  });

  it("rejects an empty bundle", () => {
    const result = shopRequestSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      message: "I would like to buy a garment from the workshop.",
      items: [],
    });
    assert.equal(result.success, false);
  });

  it("rejects an unknown garment slug", () => {
    const result = shopRequestSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      message: "I would like to buy a garment from the workshop.",
      items: [{ slug: "invented-piece", quantity: 1, fit: "m" }],
    });
    assert.equal(result.success, false);
  });

  it("accepts a tote with one-size fit", () => {
    const parsed = shopRequestSchema.parse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      message: "Please make a tote bag as a gift.",
      items: [{ slug: "tote", quantity: 1, fit: "os" }],
    });
    assert.equal(parsed.items[0]?.slug, "tote");
  });

  it("keeps cloth on each piece and defaults missing cloth to plum", () => {
    const parsed = shopRequestSchema.parse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      message: "Please make a dress and a tote in different cloths.",
      items: [
        { slug: "dress", quantity: 1, fit: "m", cloth: "gold" },
        { slug: "tote", quantity: 1, fit: "os" },
      ],
    });
    assert.equal(parsed.items[0]?.cloth, "gold");
    assert.equal(parsed.items[1]?.cloth, "plum");
  });
});
