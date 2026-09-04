import { newId, nowMs, queryFirst, run } from "@/lib/cms/db";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;

export async function recordLoginAttempt(
  db: D1Database,
  email: string,
  ip: string,
  success: boolean,
) {
  await run(
    db,
    "INSERT INTO login_attempts (id, email, ip, success, created_at) VALUES (?, ?, ?, ?, ?)",
    newId(),
    email.toLowerCase(),
    ip,
    success ? 1 : 0,
    nowMs(),
  );
}

export async function loginLocked(db: D1Database, email: string, ip: string) {
  const since = Date.now() - WINDOW_MS;
  const byEmail = await queryFirst<{ n: number }>(
    db,
    "SELECT COUNT(*) AS n FROM login_attempts WHERE email = ? AND success = 0 AND created_at > ?",
    email.toLowerCase(),
    since,
  );
  const byIp = await queryFirst<{ n: number }>(
    db,
    "SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND success = 0 AND created_at > ?",
    ip,
    since,
  );
  return (byEmail?.n ?? 0) >= MAX_FAILURES || (byIp?.n ?? 0) >= MAX_FAILURES;
}

export async function recentFailedLogins(db: D1Database, sinceMs = WINDOW_MS) {
  return queryFirst<{ n: number }>(
    db,
    "SELECT COUNT(*) AS n FROM login_attempts WHERE success = 0 AND created_at > ?",
    Date.now() - sinceMs,
  );
}
