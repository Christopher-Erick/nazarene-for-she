import { requireAuth } from "@/lib/cms/guard";
import { jsonNoStore } from "@/lib/security";
import { queryAll } from "@/lib/cms/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gated = await requireAuth(request);
  if (!gated.ok) return gated.response;
  const user = gated.ctx.auth.user;
  const requests = await queryAll(
    gated.ctx.db,
    "SELECT id, request_type, status, requested_at, completed_at FROM data_requests WHERE user_id = ? ORDER BY requested_at DESC LIMIT 20",
    user.id,
  );
  return jsonNoStore({
    ok: true,
    export: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role_slug,
      status: user.status,
      exportedAt: Date.now(),
      dataRequests: requests,
    },
  });
}
