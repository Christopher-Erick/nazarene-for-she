import { requirePermission, apiError } from "@/lib/cms/guard";
import { queryAll } from "@/lib/cms/db";
import { jsonNoStore } from "@/lib/security";
import { isSuperAdmin } from "@/lib/cms/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gated = await requirePermission(request, "audit.view");
  if (!gated.ok) return gated.response;
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 80), 200);
  const items = await queryAll(
    gated.ctx.db,
    `SELECT id, user_id, action, resource_type, resource_id, metadata, ip, created_at
     FROM audit_logs ORDER BY created_at DESC LIMIT ?`,
    limit,
  ) as Array<{
    id: string;
    user_id: string | null;
    action: string;
    resource_type: string;
    resource_id: string | null;
    metadata: string;
    ip: string;
    created_at: number;
  }>;
  return jsonNoStore({
    ok: true,
    items: items.map((row) => ({
      ...row,
      ip: isSuperAdmin(gated.ctx.auth) ? row.ip : undefined,
    })),
  });
}

export async function DELETE() {
  return apiError(403, "Audit logs cannot be deleted from the CMS.");
}
