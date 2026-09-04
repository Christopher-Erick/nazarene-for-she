import { getDb } from "@/lib/cms/db";
import { queryFirst, run, newId, nowMs } from "@/lib/cms/db";
import { hashPassword, passwordMeetsPolicy, randomToken, sha256Hex } from "@/lib/cms/password";
import { destroyUserSessions } from "@/lib/cms/auth";
import { jsonNoStore, rateLimit, clientKey, isSameOrigin } from "@/lib/security";
import { parseBody, requestIp } from "@/lib/cms/http";
import { audit } from "@/lib/cms/audit";
import { isPublicContactEmail } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonNoStore({ ok: false, message: "This action can only be completed from the admin site." }, { status: 403 });
  }
  const limited = rateLimit(`reset:${clientKey(request)}`, 5, 15 * 60 * 1000);
  if (!limited.ok) return jsonNoStore({ ok: false, message: "Please wait before trying again." }, { status: 429 });

  const db = await getDb();
  if (!db) return jsonNoStore({ ok: true });
  const body = await parseBody(request);
  if (!body.ok) return body.response;
  const email = String(body.data.email ?? "").toLowerCase().trim();
  if (!isPublicContactEmail(email)) return jsonNoStore({ ok: true });

  const user = await queryFirst<{ id: string; status: string }>(
    db,
    "SELECT id, status FROM users WHERE email = ?",
    email,
  );
  if (user && user.status === "active") {
    const token = randomToken(32);
    await run(
      db,
      "INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
      newId(),
      user.id,
      await sha256Hex(token),
      Date.now() + 60 * 60 * 1000,
      nowMs(),
    );
    await audit({ db, userId: user.id, action: "PASSWORD_RESET", resourceType: "user", resourceId: user.id, ip: requestIp(request), metadata: { requested: true } });
    if (process.env.NODE_ENV !== "production") {
      return jsonNoStore({ ok: true, devToken: token });
    }
  }
  return jsonNoStore({ ok: true });
}

export async function PUT(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonNoStore({ ok: false, message: "This action can only be completed from the admin site." }, { status: 403 });
  }
  const db = await getDb();
  if (!db) return jsonNoStore({ ok: false, message: "Unavailable." }, { status: 503 });
  const body = await parseBody(request);
  if (!body.ok) return body.response;
  const token = String(body.data.token ?? "");
  const password = String(body.data.password ?? "");
  if (!passwordMeetsPolicy(password)) {
    return jsonNoStore({ ok: false, message: "Password does not meet the policy." }, { status: 400 });
  }
  const row = await queryFirst<{ id: string; user_id: string; expires_at: number; used_at: number | null }>(
    db,
    "SELECT id, user_id, expires_at, used_at FROM password_resets WHERE token_hash = ?",
    await sha256Hex(token),
  );
  if (!row || row.used_at || row.expires_at < Date.now()) {
    return jsonNoStore({ ok: false, message: "This reset link is not valid." }, { status: 400 });
  }
  await run(db, "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", await hashPassword(password), nowMs(), row.user_id);
  await run(db, "UPDATE password_resets SET used_at = ? WHERE id = ?", nowMs(), row.id);
  await destroyUserSessions(db, row.user_id);
  await audit({ db, userId: row.user_id, action: "PASSWORD_CHANGED", resourceType: "user", resourceId: row.user_id, ip: requestIp(request) });
  return jsonNoStore({ ok: true });
}
