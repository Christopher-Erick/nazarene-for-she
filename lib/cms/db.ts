import { cloudflareEnv } from "@/lib/cms/cloudflare";

export async function getDb() {
  const env = await cloudflareEnv();
  return env?.DB ?? null;
}

export async function getMediaBucket() {
  const env = await cloudflareEnv();
  return env?.MEDIA ?? null;
}

export async function getWorkersAi() {
  const env = await cloudflareEnv();
  return env?.AI ?? null;
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
