import { getDb } from "@/lib/cms/db";
import { queryFirst, run, newId, nowMs } from "@/lib/cms/db";
import { hashPassword, passwordMeetsPolicy, randomToken, sha256Hex } from "@/lib/cms/password";
import { destroyUserSessions } from "@/lib/cms/auth";
import { jsonNoStore, rateLimit, clientKey, isSameOrigin } from "@/lib/security";
import { parseBody, requestIp } from "@/lib/cms/http";
import { audit } from "@/lib/cms/audit";
import { isPublicContactEmail } from "@/lib/security";
import { RESET_TTL_MS, resetBaseUrl, resetLink, sendResetMail } from "@/lib/cms/password-reset";

export const runtime = "nodejs";

/**
 * Request a reset link. Always answers the same way, whether or not the email has an
 * account, so the form cannot be used to discover who has admin access.
 */
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

  const user = await queryFirst<{ id: string; name: string; status: string }>(
    db,
    "SELECT id, name, status FROM users WHERE email = ?",
    email,
  );
  if (user && user.status === "active") {
    const token = randomToken(32);
    const now = nowMs();
    // Only the newest link works.
    await run(db, "UPDATE password_resets SET used_at = ? WHERE user_id = ? AND used_at IS NULL", now, user.id);
    await run(
      db,
      "INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
      newId(),
      user.id,
      await sha256Hex(token),
      now + RESET_TTL_MS,
      now,
    );
    const link = resetLink(resetBaseUrl(request.url), token);
    const sent = await sendResetMail(email, user.name, link);
    if (!sent) console.warn("[password-reset] RESEND_API_KEY is not set or mail failed — no reset email went out.");
    await audit({
      db,
      userId: user.id,
      action: "PASSWORD_RESET",
      resourceType: "user",
      resourceId: user.id,
      ip: requestIp(request),
      metadata: { requested: true, emailed: sent },
    });
    if (process.env.NODE_ENV !== "production") {
      return jsonNoStore({ ok: true, devLink: link });
    }
  }
  return jsonNoStore({ ok: true });
}

/** Use a reset link: set the new password, sign out everywhere, clear the sign-in lockout. */
export async function PUT(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonNoStore({ ok: false, message: "This action can only be completed from the admin site." }, { status: 403 });
  }
  const limited = rateLimit(`reset-use:${clientKey(request)}`, 10, 15 * 60 * 1000);
  if (!limited.ok) return jsonNoStore({ ok: false, message: "Please wait before trying again." }, { status: 429 });

  const db = await getDb();
  if (!db) return jsonNoStore({ ok: false, message: "Unavailable." }, { status: 503 });
  const body = await parseBody(request);
  if (!body.ok) return body.response;
  const token = String(body.data.token ?? "");
  const password = String(body.data.password ?? "");
  if (!passwordMeetsPolicy(password)) {
    return jsonNoStore(
      { ok: false, message: "Use at least 14 characters with upper and lower case, a number and a symbol." },
      { status: 400 },
    );
  }
  const row = await queryFirst<{ id: string; user_id: string; expires_at: number; used_at: number | null; email: string }>(
    db,
    `SELECT r.id, r.user_id, r.expires_at, r.used_at, u.email
     FROM password_resets r JOIN users u ON u.id = r.user_id
     WHERE r.token_hash = ? AND u.status = 'active'`,
    await sha256Hex(token),
  );
  if (!row || row.used_at || row.expires_at < Date.now()) {
    return jsonNoStore({ ok: false, message: "This reset link is not valid or has expired. Ask for a new one." }, { status: 400 });
  }
  await run(db, "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", await hashPassword(password), nowMs(), row.user_id);
  await run(db, "UPDATE password_resets SET used_at = ? WHERE id = ?", nowMs(), row.id);
  await run(db, "DELETE FROM login_attempts WHERE email = ? AND success = 0", row.email.toLowerCase());
  await destroyUserSessions(db, row.user_id);
  await audit({ db, userId: row.user_id, action: "PASSWORD_CHANGED", resourceType: "user", resourceId: row.user_id, ip: requestIp(request) });
  return jsonNoStore({ ok: true });
}
