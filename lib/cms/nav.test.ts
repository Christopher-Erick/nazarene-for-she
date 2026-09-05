import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canSeeAdminPath, navFor } from "./nav.ts";
import { DEFAULT_ROLE_PERMISSIONS } from "./defaults.ts";
import type { PermissionActor } from "./rbac.ts";
import type { RoleSlug } from "./permissions.ts";

function auth(role: RoleSlug): PermissionActor {
  return {
    user: { role_slug: role },
    permissions: new Set(DEFAULT_ROLE_PERMISSIONS[role]),
  };
}

describe("admin page visibility", () => {
  it("lets Super Admin open every desk page", () => {
    const superAdmin = auth("super_admin");
    assert.equal(canSeeAdminPath(superAdmin, "/admin/roles"), true);
    assert.equal(canSeeAdminPath(superAdmin, "/admin/documents/abc"), true);
    assert.equal(canSeeAdminPath(superAdmin, "/admin/shop/order/1"), true);
  });

  it("hides Roles and Documents from Admin by default", () => {
    const admin = auth("admin");
    assert.equal(navFor(admin).some((item) => item.href === "/admin/roles"), false);
    assert.equal(canSeeAdminPath(admin, "/admin/roles"), false);
    assert.equal(canSeeAdminPath(admin, "/admin/documents"), false);
    assert.equal(canSeeAdminPath(admin, "/admin/pages"), true);
  });

  it("gives Member only Today and My account until Super Admin grants pages", () => {
    const member = auth("member");
    const hrefs = navFor(member).map((item) => item.href);
    assert.deepEqual(hrefs, ["/admin", "/admin/account"]);
    assert.equal(canSeeAdminPath(member, "/admin"), true);
    assert.equal(canSeeAdminPath(member, "/admin/account"), true);
    assert.equal(canSeeAdminPath(member, "/admin/pages"), false);
    assert.equal(canSeeAdminPath(member, "/admin/shop"), false);
  });

  it("opens a page only after Super Admin grants that module's view right", () => {
    const member: PermissionActor = {
      user: { role_slug: "member" },
      permissions: new Set(["pages.view", "settings.view"]),
    };
    assert.equal(canSeeAdminPath(member, "/admin/pages"), true);
    assert.equal(canSeeAdminPath(member, "/admin/pages/about"), true);
    assert.equal(canSeeAdminPath(member, "/admin/settings"), true);
    assert.equal(canSeeAdminPath(member, "/admin/seo"), true);
    assert.equal(canSeeAdminPath(member, "/admin/shop"), false);
    assert.equal(canSeeAdminPath(member, "/admin/roles"), false);
  });
});
