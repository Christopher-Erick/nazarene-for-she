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

describe("sanitizeHtml against bypasses", () => {
  it("escapes an unfinished tag instead of passing it through", () => {
    const clean = sanitizeHtml(`Hello <img src=x onerror=alert(1)`);
    assert.equal(clean.includes("<img"), false);
    assert.match(clean, /&lt;img/);
  });

  it("drops disallowed elements with their content", () => {
    const clean = sanitizeHtml(`<p>ok</p><svg><script>alert(1)</script></svg><style>p{}</style><iframe src="x"></iframe>`);
    assert.equal(clean, "<p>ok</p>");
  });

  it("strips every attribute from allowed tags", () => {
    assert.equal(sanitizeHtml(`<p style="x" class="y" onmouseover="z">Hi</p>`), "<p>Hi</p>");
  });

  it("refuses scheme tricks in links", () => {
    for (const href of ["java&#115;cript:alert(1)", " javascript:alert(1)", "data:text/html,x", "//evil.example", "vbscript:x"]) {
      const clean = sanitizeHtml(`<a href="${href}">x</a>`);
      assert.equal(clean, "<a>x</a>", href);
    }
  });

  it("opens outside links safely and keeps entities", () => {
    const clean = sanitizeHtml(`<a href="https://example.org/?a=1&b=2">Read &mdash; more</a>`);
    assert.match(clean, /rel="noopener noreferrer"/);
    assert.match(clean, /Read &mdash; more/);
  });

  it("removes comments and keeps stray angle brackets as text", () => {
    assert.equal(sanitizeHtml(`<!-- <script>x</script> -->a < b`), "a &lt; b");
  });
});
