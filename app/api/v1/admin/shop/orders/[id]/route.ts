import { requirePermission, apiError } from "@/lib/cms/guard";
import { jsonNoStore } from "@/lib/security";
import { parseBody } from "@/lib/cms/http";
import { audit } from "@/lib/cms/audit";
import { requestIp } from "@/lib/cms/http";
import { isOrderStatus } from "@/lib/shop/types";
import { getOrder, updateOrderStatus } from "@/lib/shop/orders";

export const runtime = "nodejs";

export async function GET(request: Request, context: RouteContext<"/api/v1/admin/shop/orders/[id]">) {
  const gated = await requirePermission(request, "atelier.view");
  if (!gated.ok) return gated.response;
  const { id } = await context.params;
  const order = await getOrder(gated.ctx.db, id);
  if (!order) return apiError(404, "That order was not found.");
  return jsonNoStore({ ok: true, item: order });
}

export async function PATCH(request: Request, context: RouteContext<"/api/v1/admin/shop/orders/[id]">) {
  const gated = await requirePermission(request, "atelier.edit");
  if (!gated.ok) return gated.response;
  const { id } = await context.params;
  const body = await parseBody(request);
  if (!body.ok) return body.response;
  const status = String(body.data.status ?? "");
  if (!isOrderStatus(status)) return apiError(400, "That is not a valid order status.");
  try {
    const order = await updateOrderStatus(gated.ctx.db, id, status);
    await audit({
      db: gated.ctx.db,
      userId: gated.ctx.auth.user.id,
      action: "SHOP_ORDER_UPDATED",
      resourceType: "shop_order",
      resourceId: id,
      ip: requestIp(request),
      metadata: { status, reference: order?.reference },
    });
    return jsonNoStore({ ok: true, item: order });
  } catch (error) {
    return apiError(400, error instanceof Error ? error.message : "Could not update that order.");
  }
}
