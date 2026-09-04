import { requirePermission, apiError } from "@/lib/cms/guard";
import {
  adminContent,
  isContentType,
  listContent,
  insertContent,
  moduleForType,
  prepareContentWrite,
  slugTaken,
} from "@/lib/cms/content";
import { jsonNoStore } from "@/lib/security";
import { parseBody } from "@/lib/cms/http";
import { audit } from "@/lib/cms/audit";
import { requestIp } from "@/lib/cms/http";
import type { PermissionKey } from "@/lib/cms/permissions";

export const runtime = "nodejs";

export async function GET(request: Request, context: RouteContext<"/api/v1/admin/content/[type]">) {
  const { type } = await context.params;
  if (!isContentType(type)) return apiError(404, "Unknown content type.");
  const gated = await requirePermission(request, `${moduleForType(type)}.view` as PermissionKey);
  if (!gated.ok) return gated.response;

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const rows = await listContent(gated.ctx.db, type, {
    q,
    status: status === "draft" || status === "pending_review" || status === "approved" || status === "published" || status === "archived"
      ? status
      : undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
    offset: Number(url.searchParams.get("offset") ?? 0),
  });
  return jsonNoStore({ ok: true, items: rows.map(adminContent) });
}

export async function POST(request: Request, context: RouteContext<"/api/v1/admin/content/[type]">) {
  const { type } = await context.params;
  if (!isContentType(type)) return apiError(404, "Unknown content type.");
  const gated = await requirePermission(request, `${moduleForType(type)}.create` as PermissionKey);
  if (!gated.ok) return gated.response;

  const body = await parseBody(request);
  if (!body.ok) return body.response;

  try {
    const write = prepareContentWrite(type, body.data);
    if (await slugTaken(gated.ctx.db, type, write.slug)) {
      return apiError(409, "That slug is already in use.");
    }
    const row = await insertContent(gated.ctx.db, type, write, gated.ctx.auth.user.id);
    await audit({
      db: gated.ctx.db,
      userId: gated.ctx.auth.user.id,
      action: `${type.toUpperCase()}_CREATED`,
      resourceType: type,
      resourceId: row?.id,
      ip: requestIp(request),
    });
    return jsonNoStore({ ok: true, item: row ? adminContent(row) : null }, { status: 201 });
  } catch (error) {
    return apiError(400, error instanceof Error ? error.message : "Invalid content.");
  }
}
