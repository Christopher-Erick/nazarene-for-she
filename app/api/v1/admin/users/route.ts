import { requirePermission, apiError, countActiveSuperAdmins } from "@/lib/cms/guard";
import { queryAll, queryFirst, run, newId, nowMs } from "@/lib/cms/db";
import { hashPassword, passwordMeetsPolicy } from "@/lib/cms/password";
import { destroyUserSessions } from "@/lib/cms/auth";
import { isSuperAdmin } from "@/lib/cms/auth";
import { jsonNoStore } from "@/lib/security";
import { parseBody, requestIp } from "@/lib/cms/http";
import { audit } from "@/lib/cms/audit";
import { ROLE_SLUGS, type RoleSlug } from "@/lib/cms/permissions";
import { isPublicContactEmail } from "@/lib/security";

export const runtime = "nodejs";

type UserRow = {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: number;
  last_login_at: number | null;
  role_slug: string;
  role_name: string;
};

function publicUser(row: UserRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
    role: row.role_slug,
    roleName: row.role_name,
  };
}

const LIST_SQL = `SELECT u.id, u.name, u.email, u.status, u.created_at, u.last_login_at, r.slug AS role_slug, r.name AS role_name
  FROM users u
  JOIN user_roles ur ON ur.user_id = u.id
  JOIN roles r ON r.id = ur.role_id
  WHERE u.status != 'anonymized'`;

export async function GET(request: Request) {
  const gated = await requirePermission(request, "users.view");
  if (!gated.ok) return gated.response;
  const rows = await queryAll<UserRow>(gated.ctx.db, `${LIST_SQL} ORDER BY u.name ASC`);
  return jsonNoStore({ ok: true, items: rows.map(publicUser) });
}

export async function POST(request: Request) {
  const gated = await requirePermission(request, "users.create");
  if (!gated.ok) return gated.response;
  const body = await parseBody(request);
  if (!body.ok) return body.response;

  const email = String(body.data.email ?? "").toLowerCase().trim();
  const name = String(body.data.name ?? "").trim().slice(0, 120);
  const password = String(body.data.password ?? "");
  const role = String(body.data.role ?? "member") as RoleSlug;

  if (!name || !isPublicContactEmail(email)) {
    return apiError(400, "A valid name and email are required.");
  }
  if (!passwordMeetsPolicy(password)) {
    return apiError(400, "Password must be at least 14 characters and include upper, lower, number, and symbol.");
  }
  if (!ROLE_SLUGS.includes(role)) return apiError(400, "Unknown role.");
  if (role === "super_admin" && !isSuperAdmin(gated.ctx.auth)) {
    return apiError(403, "Only Super Admin can assign the Super Admin role.");
  }

  const exists = await queryFirst<{ id: string }>(gated.ctx.db, "SELECT id FROM users WHERE email = ?", email);
  if (exists) return apiError(409, "That email is already in use.");

  const id = newId();
  const now = nowMs();
  await run(
    gated.ctx.db,
    "INSERT INTO users (id, name, email, password_hash, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, ?)",
    id,
    name,
    email,
    await hashPassword(password),
    now,
    now,
  );
  await run(gated.ctx.db, "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", id, role);
  await audit({
    db: gated.ctx.db,
    userId: gated.ctx.auth.user.id,
    action: "USER_CREATED",
    resourceType: "user",
    resourceId: id,
    metadata: { role },
    ip: requestIp(request),
  });
  const row = await queryFirst<UserRow>(gated.ctx.db, `${LIST_SQL} AND u.id = ?`, id);
  return jsonNoStore({ ok: true, item: row ? publicUser(row) : null }, { status: 201 });
}

export async function PATCH(request: Request) {
  const gated = await requirePermission(request, "users.edit");
  if (!gated.ok) return gated.response;
  const body = await parseBody(request);
  if (!body.ok) return body.response;
  const id = String(body.data.id ?? "");
  if (!id) return apiError(400, "User id is required.");

  const current = await queryFirst<UserRow>(gated.ctx.db, `${LIST_SQL} AND u.id = ?`, id);
  if (!current) return apiError(404, "User not found.");

  const nextRole = body.data.role != null ? String(body.data.role) : current.role_slug;
  if (!ROLE_SLUGS.includes(nextRole as RoleSlug)) return apiError(400, "Unknown role.");
  if (nextRole === "super_admin" && !isSuperAdmin(gated.ctx.auth)) {
    return apiError(403, "Only Super Admin can assign the Super Admin role.");
  }
  if (!isSuperAdmin(gated.ctx.auth) && current.role_slug === "super_admin") {
    return apiError(403, "Only Super Admin can change a Super Admin account.");
  }
  if (nextRole !== current.role_slug && !isSuperAdmin(gated.ctx.auth)) {
    return apiError(403, "Only Super Admin can change another user's role.");
  }

  if (current.role_slug === "super_admin" && nextRole !== "super_admin") {
    if ((await countActiveSuperAdmins(gated.ctx.db)) <= 1) {
      return apiError(409, "The last Super Admin cannot be removed.");
    }
  }

  const name = body.data.name != null ? String(body.data.name).trim().slice(0, 120) : current.name;
  const status = body.data.status != null ? String(body.data.status) : current.status;
  if (!["active", "disabled"].includes(status)) return apiError(400, "Invalid status.");
  if (status === "disabled" && current.role_slug === "super_admin") {
    if ((await countActiveSuperAdmins(gated.ctx.db)) <= 1) {
      return apiError(409, "The last Super Admin cannot be disabled.");
    }
  }

  await run(
    gated.ctx.db,
    "UPDATE users SET name = ?, status = ?, updated_at = ? WHERE id = ?",
    name,
    status,
    nowMs(),
    id,
  );
  if (nextRole !== current.role_slug) {
    await run(gated.ctx.db, "DELETE FROM user_roles WHERE user_id = ?", id);
    await run(gated.ctx.db, "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", id, nextRole);
    await audit({
      db: gated.ctx.db,
      userId: gated.ctx.auth.user.id,
      action: "ROLE_ASSIGNED",
      resourceType: "user",
      resourceId: id,
      metadata: { from: current.role_slug, to: nextRole },
      ip: requestIp(request),
    });
  }

  if (status === "disabled" && current.status !== "disabled") {
    await destroyUserSessions(gated.ctx.db, id);
    await audit({
      db: gated.ctx.db,
      userId: gated.ctx.auth.user.id,
      action: "USER_DISABLED",
      resourceType: "user",
      resourceId: id,
      ip: requestIp(request),
    });
  }
  if (status === "active" && current.status === "disabled") {
    await audit({
      db: gated.ctx.db,
      userId: gated.ctx.auth.user.id,
      action: "USER_ENABLED",
      resourceType: "user",
      resourceId: id,
      ip: requestIp(request),
    });
  }

  if (typeof body.data.password === "string" && body.data.password) {
    if (!passwordMeetsPolicy(body.data.password)) {
      return apiError(400, "Password must be at least 14 characters and include upper, lower, number, and symbol.");
    }
    await run(
      gated.ctx.db,
      "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
      await hashPassword(body.data.password),
      nowMs(),
      id,
    );
    await destroyUserSessions(gated.ctx.db, id);
    await audit({
      db: gated.ctx.db,
      userId: gated.ctx.auth.user.id,
      action: "PASSWORD_RESET",
      resourceType: "user",
      resourceId: id,
      ip: requestIp(request),
    });
  }

  await audit({
    db: gated.ctx.db,
    userId: gated.ctx.auth.user.id,
    action: "USER_UPDATED",
    resourceType: "user",
    resourceId: id,
    ip: requestIp(request),
  });
  const row = await queryFirst<UserRow>(gated.ctx.db, `${LIST_SQL} AND u.id = ?`, id);
  return jsonNoStore({ ok: true, item: row ? publicUser(row) : null });
}
