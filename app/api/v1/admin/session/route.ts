import { getDb } from "@/lib/cms/db";
import {
  authenticateUser,
  clearSessionCookies,
  createSession,
  CSRF_COOKIE,
  csrfCookie,
  destroySession,
  loadAuth,
  readCookie,
  SESSION_COOKIE,
  sessionCookie,
} from "@/lib/cms/auth";
import { randomToken as makeToken } from "@/lib/cms/password";
import { loginLocked, recordLoginAttempt } from "@/lib/cms/lockout";
import { audit } from "@/lib/cms/audit";
import { parseBody, requestIp, isSecureRequest } from "@/lib/cms/http";
import { jsonNoStore, rateLimit, clientKey, isSameOrigin } from "@/lib/security";
import { navFor } from "@/lib/cms/nav";

export const runtime = "nodejs";

function publicUser(auth: NonNullable<Awaited<ReturnType<typeof loadAuth>>>) {
  return {
    id: auth.user.id,
    name: auth.user.name,
    email: auth.user.email,
    role: auth.user.role_slug,
    roleName: auth.user.role_name,
    permissions: [...auth.permissions],
    navigation: navFor(auth).map((item) => ({ href: item.href, label: item.label })),
  };
}

export async function GET(request: Request) {
  const db = await getDb();
  const secure = isSecureRequest(request);
  const csrf = readCookie(request, CSRF_COOKIE) ?? makeToken(18);
  const headers = new Headers();
  if (!readCookie(request, CSRF_COOKIE)) headers.append("Set-Cookie", csrfCookie(csrf, secure));

  if (!db) {
    return jsonNoStore({ ok: false, user: null, csrf }, { headers });
  }

  const auth = await loadAuth(db, readCookie(request, SESSION_COOKIE));
  if (!auth) return jsonNoStore({ ok: true, user: null, csrf }, { headers });
  return jsonNoStore({ ok: true, user: publicUser(auth), csrf }, { headers });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonNoStore({ ok: false, message: "This action can only be completed from the admin site." }, { status: 403 });
  }

  const limited = rateLimit(`login:${clientKey(request)}`, 8, 15 * 60 * 1000);
  if (!limited.ok) {
    return jsonNoStore({ ok: false, message: "Too many sign-in attempts. Please wait." }, { status: 429 });
  }

  const db = await getDb();
  if (!db) return jsonNoStore({ ok: false, message: "The content database is not configured." }, { status: 503 });

  const body = await parseBody(request);
  if (!body.ok) return body.response;
  const email = String(body.data.email ?? "").toLowerCase().trim();
  const password = String(body.data.password ?? "");
  const ip = requestIp(request);

  if (await loginLocked(db, email, ip)) {
    await audit({ db, action: "LOGIN_FAILED", resourceType: "session", metadata: { reason: "locked" }, ip });
    return jsonNoStore({ ok: false, message: "Too many sign-in attempts. Please wait." }, { status: 429 });
  }

  const result = await authenticateUser(db, email, password);
  if (!result.ok) {
    await recordLoginAttempt(db, email, ip, false);
    await audit({
      db,
      action: result.reason === "disabled" ? "LOGIN_DISABLED" : "LOGIN_FAILED",
      resourceType: "session",
      metadata: { email },
      ip,
    });
    return jsonNoStore(
      { ok: false, message: result.reason === "disabled" ? "This account is disabled." : "Email or password is incorrect." },
      { status: result.reason === "disabled" ? 403 : 401 },
    );
  }

  await recordLoginAttempt(db, email, ip, true);
  const token = await createSession(db, result.userId, request);
  const csrf = makeToken(18);
  const secure = isSecureRequest(request);
  await audit({ db, userId: result.userId, action: "LOGIN_SUCCESS", resourceType: "session", ip });

  const auth = await loadAuth(db, token);
  const headers = new Headers();
  headers.append("Set-Cookie", sessionCookie(token, secure));
  headers.append("Set-Cookie", csrfCookie(csrf, secure));
  return jsonNoStore({ ok: true, user: auth ? publicUser(auth) : null, csrf }, { headers });
}

export async function DELETE(request: Request) {
  const db = await getDb();
  const token = readCookie(request, SESSION_COOKIE);
  if (db) {
    const auth = await loadAuth(db, token);
    await destroySession(db, token);
    if (auth) {
      await audit({ db, userId: auth.user.id, action: "LOGOUT", resourceType: "session", ip: requestIp(request) });
    }
  }
  const headers = new Headers();
  for (const cookie of clearSessionCookies(isSecureRequest(request))) headers.append("Set-Cookie", cookie);
  return jsonNoStore({ ok: true }, { headers });
}
