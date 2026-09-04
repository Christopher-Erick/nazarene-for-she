import { newId, nowMs, run } from "@/lib/cms/db";

export async function audit(input: {
  db: D1Database;
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}) {
  const meta = input.metadata ? { ...input.metadata } : {};
  delete meta.password;
  delete meta.password_hash;
  delete meta.token;
  delete meta.secret;
  await run(
    input.db,
    `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, metadata, ip, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    newId(),
    input.userId ?? null,
    input.action,
    input.resourceType,
    input.resourceId ?? null,
    JSON.stringify(meta),
    input.ip ?? "",
    nowMs(),
  );
}
