import { requireSuperAdmin, apiError } from "@/lib/cms/guard";
import { queryAll, queryFirst, run, nowMs } from "@/lib/cms/db";
import { jsonNoStore } from "@/lib/security";
import { parseBody, requestIp } from "@/lib/cms/http";
import { audit } from "@/lib/cms/audit";
import { allPermissionKeys, ROLE_SLUGS, type PermissionKey } from "@/lib/cms/permissions";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gated = await requireSuperAdmin(request);
  if (!gated.ok) return gated.response;

  const roles = await queryAll<{ id: string; slug: string; name: string; description: string }>(
    gated.ctx.db,
    "SELECT id, slug, name, description FROM roles ORDER BY name ASC",
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
    const role = roles.find((item: { id: string; slug: string }) => item.id === row.role_id);
    if (!role) continue;
    matrix[role.slug] = [...(matrix[role.slug] ?? []), row.permission_id];
  }

  return jsonNoStore({ ok: true, roles, permissions, matrix });
}

export async function PUT(request: Request) {
  const gated = await requireSuperAdmin(request);
  if (!gated.ok) return gated.response;

  const body = await parseBody(request, 200_000);
  if (!body.ok) return body.response;

  const roleSlug = String(body.data.role ?? "");
  if (!ROLE_SLUGS.includes(roleSlug as (typeof ROLE_SLUGS)[number])) {
    return apiError(400, "Unknown role.");
  }

  const rawKeys = Array.isArray(body.data.permissions) ? body.data.permissions.map(String) : [];
  const allowed = new Set(allPermissionKeys());
  let keys = rawKeys.filter((key): key is PermissionKey => allowed.has(key as PermissionKey));

  if (roleSlug === "super_admin") {
    keys = allPermissionKeys();
  }
  if (roleSlug !== "super_admin") {
    keys = keys.filter((key) => !key.startsWith("roles.") && !key.startsWith("maintenance."));
  }

  const role = await queryFirst<{ id: string }>(gated.ctx.db, "SELECT id FROM roles WHERE slug = ?", roleSlug);
  if (!role) return apiError(404, "Role not found.");

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

export async function POST(request: Request) {
  const gated = await requireSuperAdmin(request);
  if (!gated.ok) return gated.response;
  return apiError(405, "The eight organisational roles are fixed.");
}

export async function DELETE() {
  return apiError(405, "The eight organisational roles cannot be deleted.");
}
