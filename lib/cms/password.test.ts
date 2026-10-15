import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashPassword, ITERATIONS, passwordMeetsPolicy, verifyPassword } from "./password.ts";

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

  it("stays within the 100,000 PBKDF2 iterations Cloudflare Workers support", async () => {
    assert.ok(ITERATIONS <= 100_000);
    const stored = await hashPassword("ValidPassphrase1!");
    assert.equal(Number(stored.split("$")[2]), ITERATIONS);
  });

  it("rejects, rather than crashes on, hashes above the Workers limit", async () => {
    const tooStrong = (await hashPassword("ValidPassphrase1!")).replace(`$${ITERATIONS}$`, "$210000$");
    assert.equal(await verifyPassword("ValidPassphrase1!", tooStrong), false);
  });

  it("accepts hashes made by the admin password-reset script", async () => {
    const { hashPassword: scriptHash } = await import("../../scripts/reset-admin-password.mjs");
    const stored = await scriptHash("ValidPassphrase1!");
    assert.equal(await verifyPassword("ValidPassphrase1!", stored), true);
    assert.equal(await verifyPassword("WrongPassphrase1!", stored), false);
  });
});
