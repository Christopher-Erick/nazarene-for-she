import type { PermissionKey, RoleSlug } from "./permissions.ts";
import { isRolesPermission } from "./permissions.ts";

export type PermissionActor = {
  user: { role_slug: RoleSlug };
  permissions: Set<PermissionKey>;
};

export function isSuperAdmin(auth: { user: { role_slug: string } }) {
  return auth.user.role_slug === "super_admin";
}

export function hasPermission(auth: PermissionActor, key: PermissionKey) {
  if (auth.user.role_slug === "super_admin") return true;
  if (isRolesPermission(key)) return false;
  return auth.permissions.has(key);
}

export function canAssignRole(actor: PermissionActor, targetRole: string) {
  if (targetRole === "super_admin") return isSuperAdmin(actor);
  return hasPermission(actor, "users.edit");
}
