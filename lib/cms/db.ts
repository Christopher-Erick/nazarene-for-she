import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getDb() {
  try {
    const ctx = await getCloudflareContext({ async: true });
    return ctx.env.DB ?? null;
  } catch {
    return null;
  }
}

export async function getMediaBucket() {
  try {
    const ctx = await getCloudflareContext({ async: true });
    return ctx.env.MEDIA ?? null;
  } catch {
    return null;
  }
}

export async function queryAll<T extends Record<string, unknown>>(
  db: D1Database,
  sql: string,
  ...params: unknown[]
) {
  const result = await db.prepare(sql).bind(...params).all<T>();
  return result.results ?? [];
}

export async function queryFirst<T extends Record<string, unknown>>(
  db: D1Database,
  sql: string,
  ...params: unknown[]
) {
  return db.prepare(sql).bind(...params).first<T>();
}

export async function run(db: D1Database, sql: string, ...params: unknown[]) {
  return db.prepare(sql).bind(...params).run();
}

export function nowMs() {
  return Date.now();
}

export function newId() {
  return crypto.randomUUID();
}
