import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseMailbox } from "./mailbox.ts";

describe("parseMailbox", () => {
  it("reads a display name and address", () => {
    assert.deepEqual(parseMailbox("Nazarene for She <noreply@nfs.org>"), { email: "noreply@nfs.org", name: "Nazarene for She" });
  });

  it("accepts a bare address", () => {
    assert.deepEqual(parseMailbox(" noreply@nfs.org "), { email: "noreply@nfs.org" });
  });

  it("rejects empty or malformed values so nothing is sent from a bad sender", () => {
    assert.equal(parseMailbox(""), null);
    assert.equal(parseMailbox("not an address"), null);
  });
});
