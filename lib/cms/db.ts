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

export async function getWorkersAi() {
  try {
    const ctx = await getCloudflareContext({ async: true });
    return ctx.env.AI ?? null;
  } catch {
    return null;
  }
}

export function isMissingSchemaError(error: unknown) {
  const text = error instanceof Error ? `${error.message} ${error.cause ?? ""}` : String(error);
  return /no such table/i.test(text);
}

export async function queryAll<T extends Record<string, unknown>>(
  db: D1Database,
  sql: string,
  ...params: unknown[]
) {
  try {
    const result = await db.prepare(sql).bind(...params).all<T>();
    return result.results ?? [];
  } catch (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }
}

export async function queryFirst<T extends Record<string, unknown>>(
  db: D1Database,
  sql: string,
  ...params: unknown[]
) {
  try {
    return await db.prepare(sql).bind(...params).first<T>();
  } catch (error) {
    if (isMissingSchemaError(error)) return null;
    throw error;
  }
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
