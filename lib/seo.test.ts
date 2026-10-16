import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fitDescription } from "./seo-text.ts";

describe("fitDescription", () => {
  it("keeps short descriptions as they are", () => {
    assert.equal(fitDescription("  Pads,   mentorship and skills. "), "Pads, mentorship and skills.");
  });

  it("cuts long descriptions at a word, within the limit", () => {
    const long = "Nazarene for She keeps girls in Kawangware, Nairobi in school with sanitary pads, menstrual health education, mentorship, tailoring and enterprise skills for life.";
    const fitted = fitDescription(long);
    assert.ok(fitted.length <= 155, String(fitted.length));
    assert.ok(fitted.endsWith("…"));
    assert.ok(!fitted.includes("  "));
  });
});
