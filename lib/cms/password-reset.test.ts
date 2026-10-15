import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resetBaseUrl, resetLink, resetMailText } from "./password-reset.ts";

describe("password reset links", () => {
  it("prefers the configured site URL over the request host", () => {
    assert.equal(resetBaseUrl("https://evil.example/api", "https://nazareneforshe.org/"), "https://nazareneforshe.org");
  });

  it("falls back to the request origin when no site URL is set", () => {
    assert.equal(resetBaseUrl("https://nfs.workers.dev/api/v1/admin/password-reset", ""), "https://nfs.workers.dev");
  });

  it("puts an encoded token on the reset page", () => {
    assert.equal(resetLink("https://x.org", "a+b/c"), "https://x.org/admin/reset-password?token=a%2Bb%2Fc");
  });

  it("names the person and includes the link in the email", () => {
    const text = resetMailText("Christopher", "https://x.org/admin/reset-password?token=t");
    assert.match(text, /Hello Christopher/);
    assert.match(text, /token=t/);
  });
});
