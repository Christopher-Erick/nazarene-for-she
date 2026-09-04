import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatSku, skuPrefix } from "./sku.ts";
import { formatKes, parseKesInput, stockLabel, stockTone } from "./money.ts";

describe("shop SKU", () => {
  it("builds a prefix from the category slug", () => {
    assert.equal(skuPrefix("dress"), "NFS-DRESS");
    assert.equal(skuPrefix("crop-top"), "NFS-CROPTOP");
  });

  it("pads the running number", () => {
    assert.equal(formatSku("NFS-DRESS", 1), "NFS-DRESS-0001");
    assert.equal(formatSku("NFS-TOTE", 12), "NFS-TOTE-0012");
  });
});

describe("shop money", () => {
  it("formats Kenyan shillings", () => {
    assert.equal(formatKes(4500), "KSh 4,500");
  });

  it("parses price fields", () => {
    assert.equal(parseKesInput("4,500"), 4500);
  });

  it("labels stock for visitors", () => {
    assert.equal(stockLabel(0), "Sold out");
    assert.equal(stockTone(2), "low");
    assert.equal(stockTone(8), "ok");
  });
});
