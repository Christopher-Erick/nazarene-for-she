import { jsonNoStore } from "@/lib/security";
import { getDb, nowMs, queryFirst, run } from "@/lib/cms/db";
import {
  CSRF_COOKIE,
  type AuthContext,
  hasPermission,
  isSuperAdmin,
  loadAuth,
  readCookie,
  SESSION_COOKIE,
} from "@/lib/cms/auth";
import type { PermissionKey } from "@/lib/cms/permissions";
import { isRolesPermission } from "@/lib/cms/permissions";
import { isSameOrigin } from "@/lib/security";

export type Guarded = {
  db: D1Database;
  auth: AuthContext;
};

export function apiError(status: number, message: string) {
  return jsonNoStore({ ok: false, message }, { status });
}

export async function requireDb() {
  const db = await getDb();
  if (!db) return { ok: false as const, response: apiError(503, "The content database is not configured.") };
  return { ok: true as const, db };
}

export function verifyMutationCsrf(request: Request) {
  if (!isSameOrigin(request)) {
    return apiError(403, "This action can only be completed from the admin site.");
  }
  const cookieToken = readCookie(request, CSRF_COOKIE);
  const headerToken = request.headers.get("x-csrf-token");
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return apiError(403, "This request could not be verified.");
  }
  return null;
}

export async function requireAuth(request: Request): Promise<{ ok: true; ctx: Guarded } | { ok: false; response: Response }> {
  const dbResult = await requireDb();
  if (!dbResult.ok) return dbResult;
  const token = readCookie(request, SESSION_COOKIE);
  const auth = await loadAuth(dbResult.db, token);
  if (!auth) return { ok: false, response: apiError(401, "Please sign in.") };
  return { ok: true, ctx: { db: dbResult.db, auth } };
}

export async function requireAuthedMutation(
  request: Request,
): Promise<{ ok: true; ctx: Guarded } | { ok: false; response: Response }> {
  const csrf = verifyMutationCsrf(request);
  if (csrf) return { ok: false, response: csrf };
  return requireAuth(request);
}

export async function requirePermission(
  request: Request,
  key: PermissionKey,
): Promise<{ ok: true; ctx: Guarded } | { ok: false; response: Response }> {
  const mutating = request.method !== "GET" && request.method !== "HEAD" && request.method !== "OPTIONS";
  if (mutating) {
    const csrf = verifyMutationCsrf(request);
    if (csrf) return { ok: false, response: csrf };
  }

  const authed = await requireAuth(request);
  if (!authed.ok) return authed;

  if (isRolesPermission(key) && !isSuperAdmin(authed.ctx.auth)) {
    await logDenied(authed.ctx, request, key);
    return { ok: false, response: apiError(403, "You do not have access to this resource.") };
  }

  if (!hasPermission(authed.ctx.auth, key)) {
    await logDenied(authed.ctx, request, key);
    return { ok: false, response: apiError(403, "You do not have access to this resource.") };
  }

  return authed;
}

export async function requireSuperAdmin(request: Request) {
  const authed = await requireAuth(request);
  if (!authed.ok) return authed;
  if (!isSuperAdmin(authed.ctx.auth)) {
    await logDenied(authed.ctx, request, "roles.view");
    return { ok: false as const, response: apiError(403, "You do not have access to this resource.") };
  }
  const mutating = request.method !== "GET" && request.method !== "HEAD";
  if (mutating) {
    const csrf = verifyMutationCsrf(request);
    if (csrf) return { ok: false as const, response: csrf };
  }
  return authed;
}

async function logDenied(ctx: Guarded, request: Request, permission: string) {
  try {
    await run(
      ctx.db,
      `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, metadata, ip, created_at)
       VALUES (?, ?, 'ACCESS_DENIED', 'permission', ?, ?, ?, ?)`,
      crypto.randomUUID(),
      ctx.auth.user.id,
      permission,
      JSON.stringify({ path: new URL(request.url).pathname, method: request.method }),
      request.headers.get("cf-connecting-ip") ?? "",
      nowMs(),
    );
    await run(
      ctx.db,
      `INSERT INTO notification_events (id, kind, message, metadata, created_at)
       VALUES (?, 'unauthorized_access', ?, ?, ?)`,
      crypto.randomUUID(),
      `Unauthorized ${request.method} for ${permission}`,
      JSON.stringify({ userId: ctx.auth.user.id, role: ctx.auth.user.role_slug }),
      nowMs(),
    );
  } catch {
    /* audit must never break the deny path */
  }
}

export async function countActiveSuperAdmins(db: D1Database) {
  const row = await queryFirst<{ n: number }>(
    db,
    `SELECT COUNT(*) AS n FROM users u
     JOIN user_roles ur ON ur.user_id = u.id
     JOIN roles r ON r.id = ur.role_id
     WHERE r.slug = 'super_admin' AND u.status = 'active'`,
  );
  return row?.n ?? 0;
}
