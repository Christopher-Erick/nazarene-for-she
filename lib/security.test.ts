import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  escapeJsonForScript,
  isHttpsPublicUrl,
  isPublicContactEmail,
  sanitizeHeaderValue,
} from "./security.ts";

describe("sanitizeHeaderValue", () => {
  it("strips CR/LF to prevent header injection", () => {
    assert.equal(sanitizeHeaderValue("Hello\r\nBcc: evil@x.com"), "Hello Bcc: evil@x.com");
  });
});

describe("escapeJsonForScript", () => {
  it("escapes angle brackets so JSON-LD cannot break out of script", () => {
    const html = escapeJsonForScript({ name: "</script><img src=x onerror=alert(1)>" });
    assert.equal(html.includes("<"), false);
    assert.equal(html.includes(">"), false);
    assert.match(html, /\\u003c/);
  });
});

describe("isHttpsPublicUrl", () => {
  it("requires https", () => {
    assert.equal(isHttpsPublicUrl("https://instagram.com/org"), true);
    assert.equal(isHttpsPublicUrl("http://instagram.com/org"), false);
    assert.equal(isHttpsPublicUrl("javascript:alert(1)"), false);
  });
});

describe("isPublicContactEmail", () => {
  it("accepts a normal organisational inbox", () => {
    assert.equal(isPublicContactEmail("nazareneforshe@gmail.com"), true);
  });

  it("rejects mailto header injection and quotes", () => {
    assert.equal(isPublicContactEmail("a@b.com\nBcc:evil@x.com"), false);
    assert.equal(isPublicContactEmail(`a@b.com">javascript:alert(1)`), false);
    assert.equal(isPublicContactEmail("not-an-email"), false);
  });
});
