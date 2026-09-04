import { requirePermission, apiError } from "@/lib/cms/guard";
import { hasPermission } from "@/lib/cms/auth";
import { jsonNoStore } from "@/lib/security";
import { parseBody } from "@/lib/cms/http";
import { audit } from "@/lib/cms/audit";
import { requestIp } from "@/lib/cms/http";
import { archiveProduct, getProduct, productFromRow, updateProduct } from "@/lib/shop/products";

export const runtime = "nodejs";

export async function GET(request: Request, context: RouteContext<"/api/v1/admin/shop/products/[id]">) {
  const gated = await requirePermission(request, "atelier.view");
  if (!gated.ok) return gated.response;
  const { id } = await context.params;
  const row = await getProduct(gated.ctx.db, id);
  if (!row) return apiError(404, "That piece is not on the rack.");
  return jsonNoStore({ ok: true, item: productFromRow(row) });
}

export async function PATCH(request: Request, context: RouteContext<"/api/v1/admin/shop/products/[id]">) {
  const gated = await requirePermission(request, "atelier.edit");
  if (!gated.ok) return gated.response;
  const { id } = await context.params;
  const body = await parseBody(request);
  if (!body.ok) return body.response;
  try {
    const row = await updateProduct(
      gated.ctx.db,
      id,
      {
        categoryId: String(body.data.categoryId ?? ""),
        name: String(body.data.name ?? ""),
        slug: body.data.slug ? String(body.data.slug) : undefined,
        summary: body.data.summary != null ? String(body.data.summary) : undefined,
        description: body.data.description != null ? String(body.data.description) : undefined,
        priceKes: body.data.priceKes,
        stock: body.data.stock,
        image: body.data.image != null ? String(body.data.image) : undefined,
        sizing: body.data.sizing != null ? String(body.data.sizing) : undefined,
        cloths: body.data.cloths,
        status: hasPermission(gated.ctx.auth, "atelier.publish") && body.data.status != null
          ? String(body.data.status)
          : undefined,
        sortOrder: body.data.sortOrder,
      },
      gated.ctx.auth.user.id,
    );
    await audit({
      db: gated.ctx.db,
      userId: gated.ctx.auth.user.id,
      action: "SHOP_PRODUCT_UPDATED",
      resourceType: "shop_product",
      resourceId: id,
      ip: requestIp(request),
      metadata: { sku: row?.sku },
    });
    return jsonNoStore({ ok: true, item: row ? productFromRow(row) : null });
  } catch (error) {
    return apiError(400, error instanceof Error ? error.message : "Could not save that piece.");
  }
}

export async function DELETE(request: Request, context: RouteContext<"/api/v1/admin/shop/products/[id]">) {
  const gated = await requirePermission(request, "atelier.delete");
  if (!gated.ok) return gated.response;
  const { id } = await context.params;
  const existing = await getProduct(gated.ctx.db, id);
  if (!existing) return apiError(404, "That piece is not on the rack.");
  await archiveProduct(gated.ctx.db, id, gated.ctx.auth.user.id);
  await audit({
    db: gated.ctx.db,
    userId: gated.ctx.auth.user.id,
    action: "SHOP_PRODUCT_REMOVED",
    resourceType: "shop_product",
    resourceId: id,
    ip: requestIp(request),
    metadata: { sku: existing.sku },
  });
  return jsonNoStore({ ok: true });
}
