import { requireSuperAdmin } from "@/lib/cms/guard";
import { getMaintenance, setSetting, resolveMaintenance, type MaintenanceState } from "@/lib/cms/settings";
import { jsonNoStore } from "@/lib/security";
import { parseBody, requestIp } from "@/lib/cms/http";
import { audit } from "@/lib/cms/audit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gated = await requireSuperAdmin(request);
  if (!gated.ok) return gated.response;
  return jsonNoStore({ ok: true, maintenance: await getMaintenance() });
}

export async function PUT(request: Request) {
  const gated = await requireSuperAdmin(request);
  if (!gated.ok) return gated.response;
  const body = await parseBody(request);
  if (!body.ok) return body.response;
  const next = resolveMaintenance({
    enabled: Boolean(body.data.enabled),
    status: (["scheduled", "active", "completed"].includes(String(body.data.status))
      ? String(body.data.status)
      : "active") as MaintenanceState["status"],
    title: String(body.data.title ?? "We will be back shortly").slice(0, 120),
    message: String(body.data.message ?? "").slice(0, 600),
    estimatedReturnAt: body.data.estimatedReturnAt ? Number(body.data.estimatedReturnAt) : null,
    contact: String(body.data.contact ?? "").slice(0, 160),
    startAt: body.data.startAt ? Number(body.data.startAt) : null,
    endAt: body.data.endAt ? Number(body.data.endAt) : null,
  });
  await setSetting(gated.ctx.db, "maintenance", next, gated.ctx.auth.user.id);
  await audit({
    db: gated.ctx.db,
    userId: gated.ctx.auth.user.id,
    action: next.enabled ? "MAINTENANCE_ENABLED" : "MAINTENANCE_DISABLED",
    resourceType: "maintenance",
    metadata: { status: next.status },
    ip: requestIp(request),
  });
  return jsonNoStore({ ok: true, maintenance: next });
}
