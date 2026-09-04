import { requirePermission } from "@/lib/cms/guard";
import { jsonNoStore } from "@/lib/security";
import { isOrderStatus } from "@/lib/shop/types";
import { countOpenOrders, listOrders } from "@/lib/shop/orders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gated = await requirePermission(request, "atelier.view");
  if (!gated.ok) return gated.response;
  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status") ?? "";
  const status = isOrderStatus(statusParam) ? statusParam : undefined;
  const items = await listOrders(gated.ctx.db, status);
  const open = await countOpenOrders(gated.ctx.db);
  return jsonNoStore({ ok: true, items, open });
}
