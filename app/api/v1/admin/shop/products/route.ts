import { requirePermission, apiError } from "@/lib/cms/guard";
import { hasPermission } from "@/lib/cms/auth";
import { jsonNoStore } from "@/lib/security";
import { parseBody } from "@/lib/cms/http";
import { audit } from "@/lib/cms/audit";
import { requestIp } from "@/lib/cms/http";
import { createProduct, listProducts, productFromRow } from "@/lib/shop/products";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gated = await requirePermission(request, "atelier.view");
  if (!gated.ok) return gated.response;
  const url = new URL(request.url);
  const categoryId = url.searchParams.get("category") ?? undefined;
  const status = url.searchParams.get("status");
  const rows = await listProducts(gated.ctx.db, {
    categoryId,
    status: status === "draft" || status === "published" || status === "archived" ? status : "all",
    includeUnlisted: true,
  });
  return jsonNoStore({ ok: true, items: rows.map(productFromRow) });
}

export async function POST(request: Request) {
  const gated = await requirePermission(request, "atelier.create");
  if (!gated.ok) return gated.response;
  const body = await parseBody(request);
  if (!body.ok) return body.response;
  try {
    const row = await createProduct(
      gated.ctx.db,
      {
        categoryId: String(body.data.categoryId ?? ""),
        name: String(body.data.name ?? ""),
        slug: body.data.slug ? String(body.data.slug) : undefined,
        summary: body.data.summary ? String(body.data.summary) : undefined,
        description: body.data.description ? String(body.data.description) : undefined,
        priceKes: body.data.priceKes,
        stock: body.data.stock,
        image: body.data.image ? String(body.data.image) : undefined,
        sizing: body.data.sizing ? String(body.data.sizing) : undefined,
        cloths: body.data.cloths,
        status: hasPermission(gated.ctx.auth, "atelier.publish") ? String(body.data.status ?? "draft") : "draft",
        sortOrder: body.data.sortOrder,
      },
      gated.ctx.auth.user.id,
    );
    await audit({
      db: gated.ctx.db,
      userId: gated.ctx.auth.user.id,
      action: "SHOP_PRODUCT_CREATED",
      resourceType: "shop_product",
      resourceId: row?.id,
      ip: requestIp(request),
      metadata: { sku: row?.sku },
    });
    return jsonNoStore({ ok: true, item: row ? productFromRow(row) : null }, { status: 201 });
  } catch (error) {
    return apiError(400, error instanceof Error ? error.message : "Could not add that piece.");
  }
}
