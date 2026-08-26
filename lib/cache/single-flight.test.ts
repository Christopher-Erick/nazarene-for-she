import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clearSingleFlight, singleFlight } from "./single-flight.ts";

describe("singleFlight", () => {
  it("dedupes concurrent callers for the same key", async () => {
    clearSingleFlight();
    let runs = 0;
    const factory = async () => {
      runs += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return "ok";
    };
    const [a, b] = await Promise.all([
      singleFlight("k", factory, 1_000),
      singleFlight("k", factory, 1_000),
    ]);
    assert.equal(a, "ok");
    assert.equal(b, "ok");
    assert.equal(runs, 1);
  });
});
