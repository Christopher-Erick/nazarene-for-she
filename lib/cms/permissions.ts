export const CMS_MODULES = [
  "pages",
  "programs",
  "stories",
  "events",
  "atelier",
  "media",
  "impact",
  "organization",
  "donations",
  "users",
  "settings",
  "audit",
  "roles",
  "maintenance",
  "privacy",
  "documents",
] as const;

export const CMS_ACTIONS = ["view", "create", "edit", "delete", "approve", "publish"] as const;

export type CmsModule = (typeof CMS_MODULES)[number];
export type CmsAction = (typeof CMS_ACTIONS)[number];
export type PermissionKey = `${CmsModule}.${CmsAction}`;

export const ROLE_SLUGS = [
  "super_admin",
  "admin",
  "chair",
  "vice_chair",
  "secretary",
  "vice_secretary",
  "treasurer",
  "member",
] as const;

export type RoleSlug = (typeof ROLE_SLUGS)[number];

export const ROLE_LABELS: Record<RoleSlug, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  chair: "Chair",
  vice_chair: "Vice Chair",
  secretary: "Secretary",
  vice_secretary: "Vice Secretary",
  treasurer: "Treasurer",
  member: "Member",
};

export const CONTENT_STATUSES = [
  "draft",
  "pending_review",
  "approved",
  "published",
  "archived",
] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export function permissionKey(module: CmsModule, action: CmsAction): PermissionKey {
  return `${module}.${action}`;
}

export function allPermissionKeys(): PermissionKey[] {
  return CMS_MODULES.flatMap((module) =>
    CMS_ACTIONS.map((action) => permissionKey(module, action)),
  );
}

export const SUPER_ADMIN_ONLY_MODULES: CmsModule[] = ["roles", "maintenance"];

export function isRolesPermission(key: string) {
  return key.startsWith("roles.");
}
