import { getDb, queryFirst, run, nowMs } from "@/lib/cms/db";
import { cache } from "react";

export type MaintenanceState = {
  enabled: boolean;
  status: "scheduled" | "active" | "completed";
  title: string;
  message: string;
  estimatedReturnAt: number | null;
  contact: string;
  startAt: number | null;
  endAt: number | null;
};

const DEFAULT_MAINTENANCE: MaintenanceState = {
  enabled: false,
  status: "completed",
  title: "We will be back shortly",
  message: "The website is temporarily unavailable while we carry out scheduled work.",
  estimatedReturnAt: null,
  contact: "",
  startAt: null,
  endAt: null,
};

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

export function resolveMaintenance(raw: MaintenanceState, now = Date.now()): MaintenanceState {
  const next = { ...DEFAULT_MAINTENANCE, ...raw };
  if (next.status === "scheduled" && next.startAt && now >= next.startAt) {
    if (!next.endAt || now < next.endAt) {
      return { ...next, enabled: true, status: "active" };
    }
    return { ...next, enabled: false, status: "completed" };
  }
  if (next.status === "active" && next.endAt && now >= next.endAt) {
    return { ...next, enabled: false, status: "completed" };
  }
  if (process.env.CMS_MAINTENANCE === "1") {
    return { ...next, enabled: true, status: "active" };
  }
  return next;
}

export const getMaintenance = cache(async function getMaintenance() {
  const stored = await getSetting<MaintenanceState>("maintenance", DEFAULT_MAINTENANCE);
  return resolveMaintenance(stored);
});

export { DEFAULT_MAINTENANCE };
