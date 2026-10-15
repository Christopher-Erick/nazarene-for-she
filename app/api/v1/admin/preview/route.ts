import { apiError, requireDb, verifyMutationCsrf } from "@/lib/cms/guard";
import { clearPreviewCookie, isSuperAdmin, loadAuth, previewCookie, readCookie, SESSION_COOKIE } from "@/lib/cms/auth";
import { ASSIGNABLE_ROLE_SLUGS } from "@/lib/cms/permissions";
import { audit } from "@/lib/cms/audit";
import { isSecureRequest, parseBody, requestIp } from "@/lib/cms/http";
import { jsonNoStore } from "@/lib/security";

export const runtime = "nodejs";

/** The signed-in person as themselves (ignoring any preview), or a response explaining why not. */
async function realSuperAdmin(request: Request) {
  const csrf = verifyMutationCsrf(request);
  if (csrf) return { ok: false as const, response: csrf };
  const dbResult = await requireDb();
  if (!dbResult.ok) return dbResult;
  const auth = await loadAuth(dbResult.db, readCookie(request, SESSION_COOKIE));
  if (!auth) return { ok: false as const, response: apiError(401, "Please sign in.") };
  if (!isSuperAdmin(auth)) return { ok: false as const, response: apiError(403, "Only a Super Admin can preview roles.") };
  return { ok: true as const, db: dbResult.db, auth };
}

/** Start previewing the desk as another role (look-only). */
export async function POST(request: Request) {
  const real = await realSuperAdmin(request);
  if (!real.ok) return real.response;
  const body = await parseBody(request);
  if (!body.ok) return body.response;
  const role = String(body.data.role ?? "");
  if (!(ASSIGNABLE_ROLE_SLUGS as readonly string[]).includes(role)) return apiError(400, "Unknown role.");

  await audit({
    db: real.db,
    userId: real.auth.user.id,
    action: "ROLE_PREVIEW_STARTED",
    resourceType: "role",
    resourceId: role,
    ip: requestIp(request),
  });
  const headers = new Headers();
  headers.append("Set-Cookie", previewCookie(role, isSecureRequest(request)));
  return jsonNoStore({ ok: true, role }, { headers });
}

/** Back to being yourself. */
export async function DELETE(request: Request) {
  const real = await realSuperAdmin(request);
  const headers = new Headers();
  headers.append("Set-Cookie", clearPreviewCookie(isSecureRequest(request)));
  if (real.ok) {
    await audit({
      db: real.db,
      userId: real.auth.user.id,
      action: "ROLE_PREVIEW_ENDED",
      resourceType: "role",
      ip: requestIp(request),
    });
  }
  // Clearing the cookie is always safe, so it happens even if the session has ended.
  return jsonNoStore({ ok: true }, { headers });
}
