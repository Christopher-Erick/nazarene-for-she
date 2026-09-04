import { requirePermission, apiError } from "@/lib/cms/guard";
import { queryAll, run, nowMs } from "@/lib/cms/db";
import { jsonNoStore } from "@/lib/security";
import { parseBody, requestIp } from "@/lib/cms/http";
import { audit } from "@/lib/cms/audit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gated = await requirePermission(request, "impact.view");
  if (!gated.ok) return gated.response;
  const items = await queryAll(
    gated.ctx.db,
    "SELECT id, label, value, status, note, sort_order, published, updated_at FROM impact_statistics ORDER BY sort_order ASC",
  );
  return jsonNoStore({ ok: true, items });
}

export async function PUT(request: Request) {
  const gated = await requirePermission(request, "impact.edit");
  if (!gated.ok) return gated.response;
  const body = await parseBody(request);
  if (!body.ok) return body.response;
  const items = Array.isArray(body.data.items) ? body.data.items : [];
  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const id = String(item.id ?? "").slice(0, 80);
    if (!id) continue;
    await run(
      gated.ctx.db,
      `INSERT INTO impact_statistics (id, label, value, status, note, sort_order, published, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         label = excluded.label, value = excluded.value, status = excluded.status, note = excluded.note,
         sort_order = excluded.sort_order, published = excluded.published, updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
      id,
      String(item.label ?? "").slice(0, 120),
      String(item.value ?? "").slice(0, 40),
      String(item.status ?? "awaiting-verification") === "verified" ? "verified" : "awaiting-verification",
      String(item.note ?? "").slice(0, 240),
      Number(item.sort_order ?? 0),
      item.published ? 1 : 0,
      gated.ctx.auth.user.id,
      nowMs(),
    );
  }
  await audit({
    db: gated.ctx.db,
    userId: gated.ctx.auth.user.id,
    action: "IMPACT_UPDATED",
    resourceType: "impact",
    ip: requestIp(request),
  });
  return jsonNoStore({ ok: true });
}

export async function POST(request: Request) {
  const gated = await requirePermission(request, "impact.publish");
  if (!gated.ok) return gated.response;
  void apiError;
  return jsonNoStore({ ok: true, message: "Use PUT and set published on each statistic." });
}
