import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sanitizeHtml, slugify } from "./sanitize.ts";

describe("sanitizeHtml", () => {
  it("strips scripts and event handlers", () => {
    const dirty = `<p onclick="alert(1)">Hello</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>`;
    const clean = sanitizeHtml(dirty);
    assert.equal(clean.includes("<script"), false);
    assert.equal(clean.includes("onclick"), false);
    assert.equal(clean.includes("javascript:"), false);
    assert.equal(clean.includes("<p>"), true);
  });

  it("keeps safe links", () => {
    const clean = sanitizeHtml(`<a href="/donate">Give</a>`);
    assert.match(clean, /href="\/donate"/);
  });
});

describe("slugify", () => {
  it("makes a safe slug", () => {
    assert.equal(slugify("Pad Distribution Day"), "pad-distribution-day");
  });
});
