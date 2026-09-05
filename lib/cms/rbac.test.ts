import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canAssignRole, hasPermission, isSuperAdmin, visibleAccounts } from "./rbac.ts";
import type { PermissionActor } from "./rbac.ts";
import { DEFAULT_ROLE_PERMISSIONS } from "./defaults.ts";

function actor(role: PermissionActor["user"]["role_slug"]): PermissionActor {
  return {
    user: { role_slug: role },
    permissions: new Set(DEFAULT_ROLE_PERMISSIONS[role]),
  };
}

describe("RBAC", () => {
  it("gives Super Admin every permission including roles", () => {
    const superAdmin = actor("super_admin");
    assert.equal(isSuperAdmin(superAdmin), true);
    assert.equal(hasPermission(superAdmin, "roles.edit"), true);
    assert.equal(hasPermission(superAdmin, "pages.publish"), true);
  });

  it("never allows Admin to manage roles even if the key is requested", () => {
    const admin = actor("admin");
    assert.equal(isSuperAdmin(admin), false);
    assert.equal(hasPermission(admin, "roles.view"), false);
    assert.equal(hasPermission(admin, "roles.edit"), false);
    assert.equal(hasPermission(admin, "pages.edit"), true);
    assert.equal(hasPermission(admin, "documents.view"), false);
    assert.equal(canAssignRole(admin, "super_admin"), false);
  });

  it("keeps Secretary from publishing or deleting by default", () => {
    const secretary = actor("secretary");
    assert.equal(hasPermission(secretary, "pages.create"), true);
    assert.equal(hasPermission(secretary, "pages.edit"), true);
    assert.equal(hasPermission(secretary, "pages.publish"), false);
    assert.equal(hasPermission(secretary, "pages.delete"), false);
    assert.equal(hasPermission(secretary, "atelier.create"), true);
    assert.equal(hasPermission(secretary, "atelier.publish"), false);
    assert.equal(hasPermission(secretary, "documents.create"), false);
    assert.equal(hasPermission(secretary, "roles.view"), false);
  });

  it("limits Treasurer to donations plus view-only content", () => {
    const treasurer = actor("treasurer");
    assert.equal(hasPermission(treasurer, "donations.edit"), true);
    assert.equal(hasPermission(treasurer, "donations.publish"), true);
    assert.equal(hasPermission(treasurer, "documents.view"), false);
    assert.equal(hasPermission(treasurer, "pages.edit"), false);
    assert.equal(hasPermission(treasurer, "roles.view"), false);
  });

  it("hides Super Admin accounts from every other role", () => {
    const rows = [
      { id: "sa", role_slug: "super_admin" },
      { id: "ad", role_slug: "admin" },
      { id: "ch", role_slug: "chair" },
    ];
    assert.deepEqual(
      visibleAccounts(actor("admin"), rows).map((row) => row.id),
      ["ad", "ch"],
    );
    assert.deepEqual(
      visibleAccounts(actor("chair"), rows).map((row) => row.id),
      ["ad", "ch"],
    );
    assert.deepEqual(
      visibleAccounts(actor("super_admin"), rows).map((row) => row.id),
      ["sa", "ad", "ch"],
    );
  });

  it("gives Member no CMS permissions", () => {
    const member = actor("member");
    assert.equal(hasPermission(member, "pages.view"), false);
    assert.equal(hasPermission(member, "documents.view"), false);
    assert.equal(hasPermission(member, "users.view"), false);
    assert.equal(hasPermission(member, "roles.view"), false);
  });
});
