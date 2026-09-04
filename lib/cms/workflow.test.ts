import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canTransition, requiredActionForTransition } from "./workflow.ts";

describe("content workflow", () => {
  it("requires approve to move from pending_review to approved", () => {
    assert.equal(requiredActionForTransition("pending_review", "approved"), "approve");
    assert.equal(requiredActionForTransition("approved", "published"), "publish");
    assert.equal(canTransition("draft", "published"), false);
  });
});
