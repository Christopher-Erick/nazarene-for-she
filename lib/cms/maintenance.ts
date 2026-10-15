/** Pure maintenance-mode rules, safe to import from middleware (no React, no DB). */

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

export const DEFAULT_MAINTENANCE: MaintenanceState = {
  enabled: false,
  status: "completed",
  title: "We will be back shortly",
  message: "The website is temporarily unavailable while we carry out scheduled work.",
  estimatedReturnAt: null,
  contact: "",
  startAt: null,
  endAt: null,
};

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
