import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_MAINTENANCE, resolveMaintenance } from "./maintenance.ts";

describe("resolveMaintenance", () => {
  const now = 1_000_000;

  it("keeps the site open by default", () => {
    assert.equal(resolveMaintenance(DEFAULT_MAINTENANCE, now).enabled, false);
  });

  it("switches a scheduled window on once it starts", () => {
    const state = resolveMaintenance({ ...DEFAULT_MAINTENANCE, status: "scheduled", startAt: now - 1, endAt: now + 1 }, now);
    assert.equal(state.enabled, true);
    assert.equal(state.status, "active");
  });

  it("does not start a scheduled window early", () => {
    const state = resolveMaintenance({ ...DEFAULT_MAINTENANCE, status: "scheduled", startAt: now + 1 }, now);
    assert.equal(state.enabled, false);
  });

  it("ends an active window after its end time", () => {
    const state = resolveMaintenance({ ...DEFAULT_MAINTENANCE, enabled: true, status: "active", endAt: now - 1 }, now);
    assert.equal(state.enabled, false);
    assert.equal(state.status, "completed");
  });
});
