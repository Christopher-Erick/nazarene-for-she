import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { categoryOrder } from "../data/shop.ts";

function categoryRank(slug: string) {
  const index = (categoryOrder as readonly string[]).indexOf(slug);
  return index === -1 ? 1000 : index;
}

describe("shop category order", () => {
  it("keeps the public rack order, not alphabetical", () => {
    assert.equal(categoryOrder[0], "skirt");
    assert.equal(categoryOrder[1], "dress");
    assert.ok(categoryRank("skirt") < categoryRank("dress"));
    assert.ok(categoryRank("dress") < categoryRank("blouse"));
    assert.ok(categoryRank("unknown") > categoryRank("cap"));
  });
});
