import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_THEME, isTheme } from "./theme.ts";

describe("theme", () => {
  it("defaults to light", () => {
    assert.equal(DEFAULT_THEME, "light");
  });

  it("accepts only light or dark", () => {
    assert.equal(isTheme("light"), true);
    assert.equal(isTheme("dark"), true);
    assert.equal(isTheme("system"), false);
    assert.equal(isTheme(null), false);
  });
});
