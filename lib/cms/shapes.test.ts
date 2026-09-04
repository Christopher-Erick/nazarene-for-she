import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { atelierPayload } from "./site-pages.ts";
import { eventPayload, isoFromDatetimeLocal, pagePayload, programPayload, storyPayload } from "./shapes.ts";

describe("website-shaped payloads", () => {
  it("stores shop category copy without the old three racks", () => {
    const payload = atelierPayload({ sizing: "one", still: "fabric", sortOrder: 4 });
    assert.equal(payload.sizing, "one");
    assert.equal(payload.still, "fabric");
    assert.equal(payload.sortOrder, 4);
    assert.equal("collection" in payload, false);
  });

  it("defaults unknown stills to the workshop table", () => {
    const payload = atelierPayload({ still: "storefront" });
    assert.equal(payload.still, "atelier");
    assert.equal(payload.sizing, "body");
  });

  it("stores event days as Nairobi ISO from datetime-local", () => {
    const iso = isoFromDatetimeLocal("2026-10-18T10:00");
    assert.equal(iso, "2026-10-18T10:00:00+03:00");
    const payload = eventPayload({ type: "distribution", startsAt: iso, featured: true });
    assert.equal(payload.type, "distribution");
    assert.equal(payload.featured, true);
  });

  it("marks stories as placeholders until consent is set", () => {
    const payload = storyPayload({ storyStatus: "placeholder", firstName: "A maker’s story" });
    assert.equal(payload.storyStatus, "placeholder");
    assert.equal(payload.firstName, "A maker’s story");
  });

  it("keeps programme buttons on this site", () => {
    const payload = programPayload({ ctaHref: "/donate?cause=dignity-kits", donationCategory: "Dignity Kits" });
    assert.equal(payload.ctaHref, "/donate?cause=dignity-kits");
    assert.equal(payload.donationCategory, "Dignity Kits");
  });

  it("fills partnership audiences from the public page when empty", () => {
    const payload = pagePayload("partnership", {});
    assert.ok(payload.audiences.includes("Churches"));
    assert.ok(payload.categories.length > 0);
  });
});
