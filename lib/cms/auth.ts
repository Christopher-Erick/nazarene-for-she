import type { PermissionKey, RoleSlug } from "@/lib/cms/permissions";
import { queryAll, queryFirst } from "@/lib/cms/db";
import { hashPassword, randomToken, sha256Hex, verifyPassword } from "@/lib/cms/password";
import { hasPermission, isSuperAdmin } from "@/lib/cms/rbac";

export const SESSION_COOKIE = "nfs_session";
export const CSRF_COOKIE = "nfs_csrf";
/** Role a Super Admin is previewing the desk as. Only honoured for a real Super Admin, and only narrows access. */
export const PREVIEW_COOKIE = "nfs_preview";
export const PREVIEW_TTL_S = 2 * 60 * 60;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export type CmsUser = {
  id: string;
  name: string;
  email: string;
  status: string;
  role_slug: RoleSlug;
  role_name: string;
};

export type AuthContext = {
  user: CmsUser;
  permissions: Set<PermissionKey>;
  /** Set while a Super Admin previews another role: user.role_* and permissions are that role's; changes are blocked. */
  preview?: { realRoleSlug: RoleSlug; realRoleName: string };
};

export async function loadAuth(
  db: D1Database,
  token: string | undefined,
  previewRole?: string | null,
): Promise<AuthContext | null> {
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const row = await queryFirst<{
    id: string;
    name: string;
    email: string;
    status: string;
    role_slug: RoleSlug;
    role_name: string;
    expires_at: number;
    session_id: string;
  }>(
    db,
    `SELECT u.id, u.name, u.email, u.status, r.slug AS role_slug, r.name AS role_name,
            s.expires_at, s.id AS session_id
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     JOIN user_roles ur ON ur.user_id = u.id
     JOIN roles r ON r.id = ur.role_id
     WHERE s.token_hash = ? LIMIT 1`,
    tokenHash,
  );
  if (!row || row.expires_at < Date.now() || row.status !== "active") return null;

  const permissionRows = await queryAll<{ id: string }>(
    db,
    `SELECT p.id FROM role_permissions rp
     JOIN permissions p ON p.id = rp.permission_id
     JOIN user_roles ur ON ur.role_id = rp.role_id
     WHERE ur.user_id = ?`,
    row.id,
  );

  const auth: AuthContext = {
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      status: row.status,
      role_slug: row.role_slug,
      role_name: row.role_name,
    },
    permissions: new Set(permissionRows.map((item: { id: string }) => item.id as PermissionKey)),
  };
  if (previewRole && previewRole !== "super_admin" && isSuperAdmin(auth)) {
    return (await previewAuth(db, auth, previewRole)) ?? auth;
  }
  return auth;
}

/** The same person, seen with another role's menu and permissions. */
async function previewAuth(db: D1Database, real: AuthContext, roleSlug: string): Promise<AuthContext | null> {
  const role = await queryFirst<{ slug: RoleSlug; name: string }>(db, "SELECT slug, name FROM roles WHERE slug = ?", roleSlug);
  if (!role || role.slug === "super_admin") return null;
  const rows = await queryAll<{ id: string }>(
    db,
    `SELECT p.id FROM role_permissions rp
     JOIN permissions p ON p.id = rp.permission_id
     JOIN roles r ON r.id = rp.role_id
     WHERE r.slug = ?`,
    role.slug,
  );
  return {
    user: { ...real.user, role_slug: role.slug, role_name: role.name },
    permissions: new Set(rows.map((item) => item.id as PermissionKey)),
    preview: { realRoleSlug: real.user.role_slug, realRoleName: real.user.role_name },
  };
}

export function previewCookie(role: string, secure: boolean) {
  return `${PREVIEW_COOKIE}=${encodeURIComponent(role)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${PREVIEW_TTL_S}${secure ? "; Secure" : ""}`;
}

export function clearPreviewCookie(secure: boolean) {
  return `${PREVIEW_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}

export { hasPermission, isSuperAdmin };

export async function createSession(
  db: D1Database,
  userId: string,
  request: Request,
) {
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      userId,
      tokenHash,
      now + SESSION_TTL_MS,
      now,
      request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
      (request.headers.get("user-agent") ?? "").slice(0, 240),
    )
    .run();
  return token;
}

export async function destroySession(db: D1Database, token: string | undefined) {
  if (!token) return;
  await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256Hex(token)).run();
}

export async function destroyUserSessions(db: D1Database, userId: string) {
  await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
}

let dummyHash: Promise<string> | null = null;

export async function authenticateUser(db: D1Database, email: string, password: string) {
  const user = await queryFirst<{
    id: string;
    password_hash: string;
    status: string;
  }>(db, "SELECT id, password_hash, status FROM users WHERE email = ?", email.toLowerCase().trim());
  if (!user || user.status !== "active") {
    // Spend the same time as a real password check, so response timing does not reveal which
    // emails have an account.
    dummyHash ??= hashPassword(randomToken(16));
    await verifyPassword(password, await dummyHash);
    return user
      ? { ok: false as const, reason: "disabled" as const }
      : { ok: false as const, reason: "invalid" as const };
  }
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return { ok: false as const, reason: "invalid" as const };
  await db.prepare("UPDATE users SET last_login_at = ? WHERE id = ?").bind(Date.now(), user.id).run();
  return { ok: true as const, userId: user.id };
}

export function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") ?? "";
  const parts = header.split(";");
  for (const part of parts) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export function sessionCookie(token: string, secure: boolean) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure ? "; Secure" : ""}`;
}

export function csrfCookie(token: string, secure: boolean) {
  return `${CSRF_COOKIE}=${encodeURIComponent(token)}; Path=/; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure ? "; Secure" : ""}`;
}

export function clearSessionCookies(secure: boolean) {
  const extra = secure ? "; Secure" : "";
  return [
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${extra}`,
    `${CSRF_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0${extra}`,
    clearPreviewCookie(secure),
  ];
}

export { hashPassword };
