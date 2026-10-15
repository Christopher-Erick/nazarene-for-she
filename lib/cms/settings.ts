import { getDb, queryFirst, run, nowMs } from "@/lib/cms/db";
import { cache } from "react";
import { DEFAULT_MAINTENANCE, resolveMaintenance, type MaintenanceState } from "@/lib/cms/maintenance";

export { DEFAULT_MAINTENANCE, resolveMaintenance, type MaintenanceState };

export const getSetting = cache(async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const db = await getDb();
  if (!db) return fallback;
  const row = await queryFirst<{ value: string }>(db, "SELECT value FROM site_settings WHERE key = ?", key);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
});

export async function setSetting(db: D1Database, key: string, value: unknown, userId: string | null) {
  await run(
    db,
    `INSERT INTO site_settings (key, value, updated_by, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
    key,
    JSON.stringify(value),
    userId,
    nowMs(),
  );
}

export const getMaintenance = cache(async function getMaintenance() {
  const stored = await getSetting<MaintenanceState>("maintenance", DEFAULT_MAINTENANCE);
  return resolveMaintenance(stored);
});

