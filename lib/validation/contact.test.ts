import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { contactSchema } from "./contact.ts";

describe("contactSchema", () => {
  it("accepts a valid payload and defaults honeypot", () => {
    const parsed = contactSchema.parse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      intent: "general",
      message: "I would like to learn more about the work.",
    });
    assert.equal(parsed.website, "");
  });

  it("rejects short messages", () => {
    const result = contactSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      intent: "general",
      message: "Hi",
    });
    assert.equal(result.success, false);
  });
});
