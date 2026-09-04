import { requirePermission, apiError } from "@/lib/cms/guard";
import {
  adminContent,
  getContent,
  isContentType,
  moduleForType,
  prepareContentWrite,
  slugTaken,
  softDeleteContent,
  updateContent,
} from "@/lib/cms/content";
import { jsonNoStore } from "@/lib/security";
import { parseBody, requestIp } from "@/lib/cms/http";
import { audit } from "@/lib/cms/audit";
import type { PermissionKey } from "@/lib/cms/permissions";

export const runtime = "nodejs";

export async function GET(request: Request, context: RouteContext<"/api/v1/admin/content/[type]/[id]">) {
  const { type, id } = await context.params;
  if (!isContentType(type)) return apiError(404, "Unknown content type.");
  const gated = await requirePermission(request, `${moduleForType(type)}.view` as PermissionKey);
  if (!gated.ok) return gated.response;
  const row = await getContent(gated.ctx.db, type, id);
  if (!row) return apiError(404, "Not found.");
  return jsonNoStore({ ok: true, item: adminContent(row) });
}

export async function PATCH(request: Request, context: RouteContext<"/api/v1/admin/content/[type]/[id]">) {
  const { type, id } = await context.params;
  if (!isContentType(type)) return apiError(404, "Unknown content type.");
  const gated = await requirePermission(request, `${moduleForType(type)}.edit` as PermissionKey);
  if (!gated.ok) return gated.response;
  const row = await getContent(gated.ctx.db, type, id);
  if (!row) return apiError(404, "Not found.");

  const body = await parseBody(request);
  if (!body.ok) return body.response;
  try {
    const write = prepareContentWrite(
      type,
      { ...row, ...body.data, payload: body.data.payload ?? JSON.parse(row.payload || "{}") },
      row.slug,
    );
    if (await slugTaken(gated.ctx.db, type, write.slug, row.id)) {
      return apiError(409, "That slug is already in use.");
    }
    const updated = await updateContent(gated.ctx.db, row, write, gated.ctx.auth.user.id);
    await audit({
      db: gated.ctx.db,
      userId: gated.ctx.auth.user.id,
      action: `${type.toUpperCase()}_UPDATED`,
      resourceType: type,
      resourceId: id,
      ip: requestIp(request),
    });
    return jsonNoStore({ ok: true, item: updated ? adminContent(updated) : null });
  } catch (error) {
    return apiError(400, error instanceof Error ? error.message : "Invalid content.");
  }
}

export async function DELETE(request: Request, context: RouteContext<"/api/v1/admin/content/[type]/[id]">) {
  const { type, id } = await context.params;
  if (!isContentType(type)) return apiError(404, "Unknown content type.");
  const gated = await requirePermission(request, `${moduleForType(type)}.delete` as PermissionKey);
  if (!gated.ok) return gated.response;
  const row = await getContent(gated.ctx.db, type, id);
  if (!row) return apiError(404, "Not found.");
  if (type === "pages") {
    return apiError(400, "Site pages cannot be deleted. Edit the published copy instead.");
  }
  await softDeleteContent(gated.ctx.db, row, gated.ctx.auth.user.id);
  await audit({
    db: gated.ctx.db,
    userId: gated.ctx.auth.user.id,
    action: `${type.toUpperCase()}_DELETED`,
    resourceType: type,
    resourceId: id,
    ip: requestIp(request),
  });
  return jsonNoStore({ ok: true });
}
