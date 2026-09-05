import { CMS_MODULES, type CmsAction, type CmsModule, type PermissionKey } from "./permissions.ts";
import { hasPermission, isSuperAdmin, type PermissionActor } from "./rbac.ts";

export type NavItem = {
  href: string;
  label: string;
  group: string;
  permission?: PermissionKey;
  superAdminOnly?: boolean;
};

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Today", group: "Today" },
  { href: "/admin/pages", label: "Site pages", group: "The website", permission: "pages.view" },
  { href: "/admin/programs", label: "Programs", group: "The website", permission: "programs.view" },
  { href: "/admin/stories", label: "Stories", group: "The website", permission: "stories.view" },
  { href: "/admin/events", label: "Events", group: "The website", permission: "events.view" },
  { href: "/admin/shop", label: "Shop", group: "The website", permission: "atelier.view" },
  { href: "/admin/impact", label: "Impact", group: "The website", permission: "impact.view" },
  { href: "/admin/organization", label: "Organization", group: "The organisation", permission: "organization.view" },
  { href: "/admin/donations", label: "Donations", group: "The organisation", permission: "donations.view" },
  { href: "/admin/documents", label: "Documents", group: "The organisation", permission: "documents.view" },
  { href: "/admin/media", label: "Photographs", group: "The organisation", permission: "media.view" },
  { href: "/admin/users", label: "People", group: "Access", permission: "users.view" },
  { href: "/admin/roles", label: "Roles & access", group: "Access", permission: "roles.view", superAdminOnly: true },
  { href: "/admin/settings", label: "Settings", group: "Housekeeping", permission: "settings.view" },
  { href: "/admin/seo", label: "Search", group: "Housekeeping", permission: "settings.view" },
  { href: "/admin/privacy", label: "Privacy", group: "Housekeeping", permission: "privacy.view" },
  { href: "/admin/maintenance", label: "Maintenance", group: "Housekeeping", permission: "maintenance.view", superAdminOnly: true },
  { href: "/admin/audit", label: "Activity", group: "Housekeeping", permission: "audit.view" },
  { href: "/admin/account", label: "My account", group: "You" },
];

export function navFor(auth: PermissionActor, extra?: { documents?: boolean }) {
  return ADMIN_NAV.filter((item) => {
    if (item.superAdminOnly) return isSuperAdmin(auth);
    if (item.href === "/admin/documents" && extra?.documents) return true;
    if (!item.permission) return true;
    return hasPermission(auth, item.permission);
  });
}

export function pathCoveredByNav(pathname: string, visibleHrefs: Iterable<string>) {
  const path = (pathname.replace(/\/+$/, "") || "/admin").split("?")[0];
  if (path === "/admin" || path.startsWith("/admin/account")) return true;
  if (path.startsWith("/admin/atelier")) return pathCoveredByNav("/admin/shop", visibleHrefs);
  const visible = new Set(visibleHrefs);
  const match = ADMIN_NAV.filter(
    (item) => item.href !== "/admin" && (path === item.href || path.startsWith(`${item.href}/`)),
  ).sort((a, b) => b.href.length - a.href.length)[0];
  if (!match) return false;
  return visible.has(match.href);
}

export function canSeeAdminPath(auth: PermissionActor, pathname: string, extra?: { documents?: boolean }) {
  return pathCoveredByNav(
    pathname,
    navFor(auth, extra).map((item) => item.href),
  );
}

export const GRANTABLE_ADMIN_PAGES = ADMIN_NAV.filter(
  (item): item is NavItem & { permission: PermissionKey } => Boolean(item.permission) && !item.superAdminOnly,
).map((item) => ({
  href: item.href,
  label: item.label,
  module: item.permission.split(".")[0] as CmsModule,
}));

export const MATRIX_MODULES: CmsModule[] = CMS_MODULES.filter((module) => module !== "roles" && module !== "maintenance");
export const MATRIX_ACTIONS: CmsAction[] = ["view", "create", "edit", "delete", "approve", "publish"];
