import { ROLE_SLUGS } from "./permissions.ts";

/**
 * Roles live in the `roles` table. The eight in ROLE_SLUGS ship with the site and cannot be deleted;
 * a Super Admin can add more. Super Admin itself is never assignable from the admin.
 */
export type RoleRow = { id: string; slug: string; name: string; description: string; user_count?: number };

export const ROLE_NAME_MAX = 60;
export const ROLE_DESCRIPTION_MAX = 240;

export function isBuiltInRole(slug: string) {
  return (ROLE_SLUGS as readonly string[]).includes(slug);
}

/** "Youth Coordinator" → "youth_coordinator"; never empty, never a built-in or taken slug. */
export function roleSlugFromName(name: string, taken: Iterable<string>) {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "role";
  const used = new Set([...taken, ...ROLE_SLUGS]);
  if (!used.has(base)) return base;
  for (let n = 2; ; n += 1) {
    const candidate = `${base}_${n}`;
    if (!used.has(candidate)) return candidate;
  }
}

/** Every active role except Super Admin, in a stable order: built-ins first, then custom by name. */
export async function listAssignableRoles(db: D1Database): Promise<RoleRow[]> {
  const result = await db
    .prepare("SELECT id, slug, name, description FROM roles WHERE status = 'active' AND slug != 'super_admin'")
    .all<RoleRow>();
  return sortRoles(result.results ?? []);
}

export function sortRoles<T extends { slug: string; name: string }>(roles: T[]) {
  const order = new Map<string, number>(ROLE_SLUGS.map((slug, index) => [slug, index]));
  return [...roles].sort((a, b) => {
    const ai = order.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
    const bi = order.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
    return ai - bi || a.name.localeCompare(b.name);
  });
}

/** An active role that may be given to someone (anything but Super Admin). */
export async function isAssignableRole(db: D1Database, slug: string) {
  if (!slug || slug === "super_admin") return false;
  const row = await db
    .prepare("SELECT slug FROM roles WHERE slug = ? AND status = 'active'")
    .bind(slug)
    .first<{ slug: string }>();
  return Boolean(row);
}
