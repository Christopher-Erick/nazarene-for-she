import { requirePermission, requireAuth, requireAuthedMutation, apiError } from "@/lib/cms/guard";
import { jsonNoStore, isPublicContactEmail } from "@/lib/security";
import { parseBody, requestIp } from "@/lib/cms/http";
import { hashPassword, passwordMeetsPolicy, verifyPassword } from "@/lib/cms/password";
import { destroyUserSessions } from "@/lib/cms/auth";
import { run, nowMs, newId } from "@/lib/cms/db";
import { audit } from "@/lib/cms/audit";
import { queryFirst } from "@/lib/cms/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gated = await requireAuth(request);
  if (!gated.ok) return gated.response;
  const { auth } = gated.ctx;
  return jsonNoStore({
    ok: true,
    user: {
      id: auth.user.id,
      name: auth.user.name,
      email: auth.user.email,
      role: auth.user.role_slug,
      roleName: auth.user.role_name,
    },
  });
}

export async function PATCH(request: Request) {
  const gated = await requireAuthedMutation(request);
  if (!gated.ok) return gated.response;
  const body = await parseBody(request);
  if (!body.ok) return body.response;

  const name = body.data.name != null ? String(body.data.name).trim().slice(0, 120) : gated.ctx.auth.user.name;
  const nextEmail =
    body.data.email != null ? String(body.data.email).toLowerCase().trim() : gated.ctx.auth.user.email;
  if (body.data.role || body.data.status || body.data.permissions) {
    return apiError(403, "You cannot change authorization fields on your own account here.");
  }

  const emailChanging = nextEmail !== gated.ctx.auth.user.email;
  const passwordChanging =
    typeof body.data.currentPassword === "string" &&
    typeof body.data.newPassword === "string" &&
    body.data.newPassword.length > 0;

  if (emailChanging) {
    if (!isPublicContactEmail(nextEmail)) {
      return apiError(400, "A valid email is required.");
    }
    const taken = await queryFirst<{ id: string }>(
      gated.ctx.db,
      "SELECT id FROM users WHERE email = ? AND id != ?",
      nextEmail,
      gated.ctx.auth.user.id,
    );
    if (taken) return apiError(409, "That email is already in use.");
    if (typeof body.data.currentPassword !== "string" || !body.data.currentPassword) {
      return apiError(400, "Enter your current password to change email.");
    }
  }

  let passwordHash: string | null = null;
  if (emailChanging || passwordChanging) {
    const row = await queryFirst<{ password_hash: string }>(
      gated.ctx.db,
      "SELECT password_hash FROM users WHERE id = ?",
      gated.ctx.auth.user.id,
    );
    if (!row || !(await verifyPassword(String(body.data.currentPassword ?? ""), row.password_hash))) {
      return apiError(400, "Current password is incorrect.");
    }
    if (passwordChanging) {
      if (!passwordMeetsPolicy(String(body.data.newPassword))) {
        return apiError(400, "Password must be at least 14 characters and include upper, lower, number, and symbol.");
      }
      passwordHash = await hashPassword(String(body.data.newPassword));
    }
  }

  if (passwordHash) {
    await run(
      gated.ctx.db,
      "UPDATE users SET name = ?, email = ?, password_hash = ?, updated_at = ? WHERE id = ?",
      name,
      nextEmail,
      passwordHash,
      nowMs(),
      gated.ctx.auth.user.id,
    );
    await destroyUserSessions(gated.ctx.db, gated.ctx.auth.user.id);
    await audit({
      db: gated.ctx.db,
      userId: gated.ctx.auth.user.id,
      action: "PASSWORD_CHANGED",
      resourceType: "user",
      resourceId: gated.ctx.auth.user.id,
      ip: requestIp(request),
    });
  } else {
    await run(
      gated.ctx.db,
      "UPDATE users SET name = ?, email = ?, updated_at = ? WHERE id = ?",
      name,
      nextEmail,
      nowMs(),
      gated.ctx.auth.user.id,
    );
  }

  if (emailChanging) {
    await audit({
      db: gated.ctx.db,
      userId: gated.ctx.auth.user.id,
      action: "USER_UPDATED",
      resourceType: "user",
      resourceId: gated.ctx.auth.user.id,
      metadata: { emailChanged: true },
      ip: requestIp(request),
    });
  }

  return jsonNoStore({ ok: true, email: nextEmail });
}

export async function POST(request: Request) {
  const gated = await requireAuthedMutation(request);
  if (!gated.ok) return gated.response;
  const body = await parseBody(request);
  if (!body.ok) return body.response;
  const type = String(body.data.requestType ?? "");
  if (type !== "export" && type !== "deletion") return apiError(400, "Unknown request type.");
  await run(
    gated.ctx.db,
    "INSERT INTO data_requests (id, user_id, request_type, status, requested_at) VALUES (?, ?, ?, 'pending', ?)",
    newId(),
    gated.ctx.auth.user.id,
    type,
    nowMs(),
  );
  await audit({
    db: gated.ctx.db,
    userId: gated.ctx.auth.user.id,
    action: type === "export" ? "DATA_EXPORT_REQUESTED" : "DATA_DELETION_REQUESTED",
    resourceType: "data_request",
    resourceId: gated.ctx.auth.user.id,
    ip: requestIp(request),
  });
  return jsonNoStore({ ok: true, message: "Your request has been recorded." }, { status: 201 });
}

export async function PUT(request: Request) {
  const gated = await requirePermission(request, "users.view");
  if (!gated.ok) return gated.response;
  const url = new URL(request.url);
  if (url.searchParams.get("export") !== "self") return apiError(400, "Invalid export.");
  const self = await requireAuth(request);
  if (!self.ok) return self.response;
  const user = self.ctx.auth.user;
  return jsonNoStore({
    ok: true,
    export: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role_slug,
      exportedAt: Date.now(),
    },
  });
}
