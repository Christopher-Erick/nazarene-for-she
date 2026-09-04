import { requirePermission, apiError } from "@/lib/cms/guard";
import { getContent, isContentType, listVersions, moduleForType, restoreVersion, adminContent } from "@/lib/cms/content";
import { jsonNoStore } from "@/lib/security";
import { parseBody, requestIp } from "@/lib/cms/http";
import { audit } from "@/lib/cms/audit";
import { isSuperAdmin } from "@/lib/cms/auth";
import type { PermissionKey } from "@/lib/cms/permissions";

export const runtime = "nodejs";

export async function GET(request: Request, context: RouteContext<"/api/v1/admin/content/[type]/[id]/versions">) {
  const { type, id } = await context.params;
  if (!isContentType(type)) return apiError(404, "Unknown content type.");
  const gated = await requirePermission(request, `${moduleForType(type)}.view` as PermissionKey);
  if (!gated.ok) return gated.response;
  const row = await getContent(gated.ctx.db, type, id);
  if (!row) return apiError(404, "Not found.");
  return jsonNoStore({ ok: true, versions: await listVersions(gated.ctx.db, id) });
}

export async function POST(request: Request, context: RouteContext<"/api/v1/admin/content/[type]/[id]/versions">) {
  const { type, id } = await context.params;
  if (!isContentType(type)) return apiError(404, "Unknown content type.");
  const gated = await requirePermission(request, `${moduleForType(type)}.edit` as PermissionKey);
  if (!gated.ok) return gated.response;
  if (!isSuperAdmin(gated.ctx.auth)) {
    const publish = await requirePermission(request, `${moduleForType(type)}.publish` as PermissionKey);
    if (!publish.ok) return apiError(403, "Only authorised administrators can restore versions.");
  }
  const row = await getContent(gated.ctx.db, type, id);
  if (!row) return apiError(404, "Not found.");
  const body = await parseBody(request);
  if (!body.ok) return body.response;
  const versionId = String(body.data.versionId ?? "");
  const restored = await restoreVersion(gated.ctx.db, row, versionId, gated.ctx.auth.user.id);
  if (!restored) return apiError(404, "Version not found.");
  await audit({
    db: gated.ctx.db,
    userId: gated.ctx.auth.user.id,
    action: `${type.toUpperCase()}_RESTORED`,
    resourceType: type,
    resourceId: id,
    metadata: { versionId },
    ip: requestIp(request),
  });
  return jsonNoStore({ ok: true, item: adminContent(restored) });
}
