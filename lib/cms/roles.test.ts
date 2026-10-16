import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBuiltInRole, roleSlugFromName, sortRoles } from "./roles.ts";

describe("custom roles", () => {
  it("turns a name into a safe slug", () => {
    assert.equal(roleSlugFromName("Youth Coordinator", []), "youth_coordinator");
    assert.equal(roleSlugFromName("  Field — Officer!! ", []), "field_officer");
    assert.equal(roleSlugFromName("***", []), "role");
  });

  it("never reuses a built-in or existing slug", () => {
    assert.equal(roleSlugFromName("Treasurer", []), "treasurer_2");
    assert.equal(roleSlugFromName("Super Admin", []), "super_admin_2");
    assert.equal(roleSlugFromName("Mentor", ["mentor", "mentor_2"]), "mentor_3");
  });

  it("knows which roles ship with the site", () => {
    assert.equal(isBuiltInRole("secretary"), true);
    assert.equal(isBuiltInRole("youth_coordinator"), false);
  });

  it("lists built-in roles first, then custom ones by name", () => {
    const sorted = sortRoles([
      { slug: "youth_coordinator", name: "Youth Coordinator" },
      { slug: "member", name: "Member" },
      { slug: "admin", name: "Admin" },
      { slug: "donor_liaison", name: "Donor Liaison" },
    ]);
    assert.deepEqual(
      sorted.map((role) => role.slug),
      ["admin", "member", "donor_liaison", "youth_coordinator"],
    );
  });
});
