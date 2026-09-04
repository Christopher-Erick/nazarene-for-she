import { requirePermission, apiError } from "@/lib/cms/guard";
import {
  adminContent,
  getContent,
  isContentStatus,
  isContentType,
  moduleForType,
  setContentStatus,
} from "@/lib/cms/content";
import { requiredActionForTransition } from "@/lib/cms/workflow";
import { jsonNoStore } from "@/lib/security";
import { parseBody, requestIp } from "@/lib/cms/http";
import { audit } from "@/lib/cms/audit";
import type { PermissionKey } from "@/lib/cms/permissions";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: RouteContext<"/api/v1/admin/content/[type]/[id]/transition">,
) {
  const { type, id } = await context.params;
  if (!isContentType(type)) return apiError(404, "Unknown content type.");
  const body = await parseBody(request);
  if (!body.ok) return body.response;
  const status = String(body.data.status ?? "");
  if (!isContentStatus(status)) return apiError(400, "Invalid status.");

  const view = await requirePermission(request, `${moduleForType(type)}.view` as PermissionKey);
  if (!view.ok) return view.response;
  const row = await getContent(view.ctx.db, type, id);
  if (!row) return apiError(404, "Not found.");

  const action = requiredActionForTransition(row.status, status);
  if (!action) return apiError(400, "That status change is not allowed.");

  const gated = await requirePermission(request, `${moduleForType(type)}.${action}` as PermissionKey);
  if (!gated.ok) return gated.response;

  const updated = await setContentStatus(gated.ctx.db, row, status, gated.ctx.auth.user.id);
  await audit({
    db: gated.ctx.db,
    userId: gated.ctx.auth.user.id,
    action: `${type.toUpperCase()}_${status.toUpperCase()}`,
    resourceType: type,
    resourceId: id,
    metadata: { from: row.status, to: status },
    ip: requestIp(request),
  });
  return jsonNoStore({ ok: true, item: updated ? adminContent(updated) : null });
}
