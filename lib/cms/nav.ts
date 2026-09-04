import { CMS_MODULES, type CmsAction, type CmsModule, type PermissionKey } from "@/lib/cms/permissions";
import type { AuthContext } from "@/lib/cms/auth";
import { hasPermission, isSuperAdmin } from "@/lib/cms/auth";

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

export function navFor(auth: AuthContext) {
  return ADMIN_NAV.filter((item) => {
    if (item.superAdminOnly) return isSuperAdmin(auth);
    if (!item.permission) return true;
    return hasPermission(auth, item.permission);
  });
}

export const MATRIX_MODULES: CmsModule[] = CMS_MODULES.filter((module) => module !== "roles" && module !== "maintenance");
export const MATRIX_ACTIONS: CmsAction[] = ["view", "create", "edit", "delete", "approve", "publish"];
