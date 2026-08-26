import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  escapeJsonForScript,
  isHttpsPublicUrl,
  isSafeWebhookUrl,
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

describe("isSafeWebhookUrl", () => {
  it("rejects non-https and private hosts", () => {
    assert.equal(isSafeWebhookUrl("http://example.com/hook"), false);
    assert.equal(isSafeWebhookUrl("https://127.0.0.1/hook"), false);
    assert.equal(isSafeWebhookUrl("https://192.168.1.10/hook"), false);
    assert.equal(isSafeWebhookUrl("https://hooks.example.com/path"), true);
  });
});

describe("isHttpsPublicUrl", () => {
  it("requires https", () => {
    assert.equal(isHttpsPublicUrl("https://instagram.com/org"), true);
    assert.equal(isHttpsPublicUrl("http://instagram.com/org"), false);
    assert.equal(isHttpsPublicUrl("javascript:alert(1)"), false);
  });
});
