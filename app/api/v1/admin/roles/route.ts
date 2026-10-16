import { requireSuperAdmin, apiError } from "@/lib/cms/guard";
import { queryAll, queryFirst, run, nowMs } from "@/lib/cms/db";
import { jsonNoStore } from "@/lib/security";
import { parseBody, requestIp } from "@/lib/cms/http";
import { audit } from "@/lib/cms/audit";
import { allPermissionKeys, type PermissionKey } from "@/lib/cms/permissions";
import { isBuiltInRole, ROLE_DESCRIPTION_MAX, ROLE_NAME_MAX, roleSlugFromName, sortRoles } from "@/lib/cms/roles";

export const runtime = "nodejs";

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

/** Permissions a role may hold: everything except managing roles and maintenance (Super Admin only). */
function grantable(keys: string[]) {
  const allowed = new Set(allPermissionKeys());
  return keys.filter(
    (key): key is PermissionKey =>
      allowed.has(key as PermissionKey) && !key.startsWith("roles.") && !key.startsWith("maintenance."),
  );
}

export async function GET(request: Request) {
  const gated = await requireSuperAdmin(request);
  if (!gated.ok) return gated.response;

  const roles = await queryAll<{ id: string; slug: string; name: string; description: string; user_count: number }>(
    gated.ctx.db,
    `SELECT r.id, r.slug, r.name, r.description,
            (SELECT COUNT(*) FROM user_roles ur JOIN users u ON u.id = ur.user_id
             WHERE ur.role_id = r.id AND u.status != 'anonymized') AS user_count
     FROM roles r WHERE r.status = 'active'`,
  );
  const permissions = await queryAll<{ id: string; module: string; action: string; description: string }>(
    gated.ctx.db,
    "SELECT id, module, action, description FROM permissions ORDER BY module, action",
  );
  const matrixRows = await queryAll<{ role_id: string; permission_id: string }>(
    gated.ctx.db,
    "SELECT role_id, permission_id FROM role_permissions",
  );

  const matrix: Record<string, string[]> = {};
  for (const role of roles) matrix[role.slug] = [];
  for (const row of matrixRows) {
    const role = roles.find((item) => item.id === row.role_id);
    if (!role) continue;
    matrix[role.slug] = [...(matrix[role.slug] ?? []), row.permission_id];
  }

  return jsonNoStore({
    ok: true,
    roles: sortRoles(roles).map((role) => ({ ...role, builtIn: isBuiltInRole(role.slug) })),
    permissions,
    matrix,
  });
}

/** Save what a role may do. */
export async function PUT(request: Request) {
  const gated = await requireSuperAdmin(request);
  if (!gated.ok) return gated.response;

  const body = await parseBody(request, 200_000);
  if (!body.ok) return body.response;

  const roleSlug = String(body.data.role ?? "");
  const role = await queryFirst<{ id: string }>(
    gated.ctx.db,
    "SELECT id FROM roles WHERE slug = ? AND status = 'active'",
    roleSlug,
  );
  if (!role) return apiError(404, "Role not found.");

  const rawKeys = Array.isArray(body.data.permissions) ? body.data.permissions.map(String) : [];
  const keys = roleSlug === "super_admin" ? allPermissionKeys() : grantable(rawKeys);

  await run(gated.ctx.db, "DELETE FROM role_permissions WHERE role_id = ?", role.id);
  for (const key of keys) {
    await run(gated.ctx.db, "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)", role.id, key);
  }

  await audit({
    db: gated.ctx.db,
    userId: gated.ctx.auth.user.id,
    action: "PERMISSION_CHANGED",
    resourceType: "role",
    resourceId: roleSlug,
    metadata: { count: keys.length },
    ip: requestIp(request),
  });

  return jsonNoStore({ ok: true, role: roleSlug, permissions: keys });
}

/** Create a role, optionally starting from another role's permissions. */
export async function POST(request: Request) {
  const gated = await requireSuperAdmin(request);
  if (!gated.ok) return gated.response;
  const body = await parseBody(request);
  if (!body.ok) return body.response;

  const name = cleanText(body.data.name, ROLE_NAME_MAX);
  if (name.length < 2) return apiError(400, "Give the role a name of at least 2 characters.");
  const description = cleanText(body.data.description, ROLE_DESCRIPTION_MAX);

  const existing = await queryAll<{ slug: string; name: string }>(gated.ctx.db, "SELECT slug, name FROM roles");
  if (existing.some((role) => role.name.toLowerCase() === name.toLowerCase())) {
    return apiError(409, "A role with that name already exists.");
  }
  const slug = roleSlugFromName(name, existing.map((role) => role.slug));
  const now = nowMs();
  await run(
    gated.ctx.db,
    "INSERT INTO roles (id, slug, name, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, ?)",
    slug,
    slug,
    name,
    description,
    now,
    now,
  );

  // Start from another role's permissions if asked (never Super Admin's).
  const copyFrom = String(body.data.copyFrom ?? "");
  let copied = 0;
  if (copyFrom && copyFrom !== "super_admin") {
    const source = await queryAll<{ permission_id: string }>(
      gated.ctx.db,
      `SELECT rp.permission_id FROM role_permissions rp JOIN roles r ON r.id = rp.role_id WHERE r.slug = ?`,
      copyFrom,
    );
    for (const key of grantable(source.map((row) => row.permission_id))) {
      await run(gated.ctx.db, "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)", slug, key);
      copied += 1;
    }
  }

  await audit({
    db: gated.ctx.db,
    userId: gated.ctx.auth.user.id,
    action: "ROLE_CREATED",
    resourceType: "role",
    resourceId: slug,
    metadata: { name, copyFrom: copyFrom || null, permissions: copied },
    ip: requestIp(request),
  });
  return jsonNoStore({ ok: true, role: { slug, name, description, builtIn: false, user_count: 0 } }, { status: 201 });
}

/** Rename or re-describe a role you created (built-in names are used across the desk). */
export async function PATCH(request: Request) {
  const gated = await requireSuperAdmin(request);
  if (!gated.ok) return gated.response;
  const body = await parseBody(request);
  if (!body.ok) return body.response;

  const slug = String(body.data.role ?? "");
  const role = await queryFirst<{ slug: string; name: string }>(
    gated.ctx.db,
    "SELECT slug, name FROM roles WHERE slug = ? AND status = 'active'",
    slug,
  );
  if (!role) return apiError(404, "Role not found.");
  const name = body.data.name != null ? cleanText(body.data.name, ROLE_NAME_MAX) : role.name;
  if (name !== role.name && isBuiltInRole(slug)) return apiError(403, "Built-in roles keep their names.");
  if (name.length < 2) return apiError(400, "Give the role a name of at least 2 characters.");
  if (name.toLowerCase() !== role.name.toLowerCase()) {
    const clash = await queryFirst<{ slug: string }>(
      gated.ctx.db,
      "SELECT slug FROM roles WHERE lower(name) = lower(?) AND slug != ?",
      name,
      slug,
    );
    if (clash) return apiError(409, "A role with that name already exists.");
  }
  const description = cleanText(body.data.description, ROLE_DESCRIPTION_MAX);
  await run(
    gated.ctx.db,
    "UPDATE roles SET name = ?, description = ?, updated_at = ? WHERE slug = ?",
    name,
    description,
    nowMs(),
    slug,
  );
  await audit({
    db: gated.ctx.db,
    userId: gated.ctx.auth.user.id,
    action: "ROLE_UPDATED",
    resourceType: "role",
    resourceId: slug,
    metadata: { name },
    ip: requestIp(request),
  });
  return jsonNoStore({ ok: true });
}

/** Delete a role you created, once nobody holds it. */
export async function DELETE(request: Request) {
  const gated = await requireSuperAdmin(request);
  if (!gated.ok) return gated.response;
  const slug = new URL(request.url).searchParams.get("role") ?? "";
  if (isBuiltInRole(slug)) return apiError(403, "The built-in roles cannot be deleted.");
  const role = await queryFirst<{ id: string; name: string }>(gated.ctx.db, "SELECT id, name FROM roles WHERE slug = ?", slug);
  if (!role) return apiError(404, "Role not found.");
  const holders = await queryFirst<{ n: number }>(
    gated.ctx.db,
    "SELECT COUNT(*) AS n FROM user_roles WHERE role_id = ?",
    role.id,
  );
  if ((holders?.n ?? 0) > 0) {
    return apiError(409, `${holders?.n} ${holders?.n === 1 ? "person has" : "people have"} this role. Give them another role first.`);
  }
  await run(gated.ctx.db, "DELETE FROM role_permissions WHERE role_id = ?", role.id);
  await run(gated.ctx.db, "DELETE FROM roles WHERE id = ?", role.id);
  await audit({
    db: gated.ctx.db,
    userId: gated.ctx.auth.user.id,
    action: "ROLE_DELETED",
    resourceType: "role",
    resourceId: slug,
    metadata: { name: role.name },
    ip: requestIp(request),
  });
  return jsonNoStore({ ok: true });
}
