import { requirePermission, apiError } from "@/lib/cms/guard";
import { jsonNoStore } from "@/lib/security";
import { parseBody } from "@/lib/cms/http";
import { audit } from "@/lib/cms/audit";
import { requestIp } from "@/lib/cms/http";
import { adjustStock, getProduct, productFromRow } from "@/lib/shop/products";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: RouteContext<"/api/v1/admin/shop/products/[id]/stock">) {
  const gated = await requirePermission(request, "atelier.edit");
  if (!gated.ok) return gated.response;
  const { id } = await context.params;
  const existing = await getProduct(gated.ctx.db, id);
  if (!existing) return apiError(404, "That piece is not on the rack.");
  const body = await parseBody(request);
  if (!body.ok) return body.response;
  const stock = Math.max(0, Math.floor(Number(body.data.stock)));
  if (!Number.isFinite(stock)) return apiError(400, "Enter how many are on the rack.");
  const row = await adjustStock(gated.ctx.db, id, stock, gated.ctx.auth.user.id);
  await audit({
    db: gated.ctx.db,
    userId: gated.ctx.auth.user.id,
    action: "SHOP_STOCK_UPDATED",
    resourceType: "shop_product",
    resourceId: id,
    ip: requestIp(request),
    metadata: { sku: existing.sku, from: existing.stock, to: stock },
  });
  return jsonNoStore({ ok: true, item: row ? productFromRow(row) : null });
}
