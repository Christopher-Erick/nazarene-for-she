import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashPassword, passwordMeetsPolicy, verifyPassword } from "./password.ts";

describe("password policy", () => {
  it("requires length and character classes", () => {
    assert.equal(passwordMeetsPolicy("short"), false);
    assert.equal(passwordMeetsPolicy("alllowercaseletterslong"), false);
    assert.equal(passwordMeetsPolicy("ValidPassphrase1!"), true);
  });
});

describe("password hashing", () => {
  it("verifies the original password and rejects another", async () => {
    const stored = await hashPassword("ValidPassphrase1!");
    assert.equal(stored.includes("pbkdf2"), true);
    assert.equal(await verifyPassword("ValidPassphrase1!", stored), true);
    assert.equal(await verifyPassword("WrongPassphrase1!", stored), false);
  });
});
