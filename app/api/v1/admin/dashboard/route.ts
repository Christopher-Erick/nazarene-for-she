import { requireAuth } from "@/lib/cms/guard";
import { hasPermission as can } from "@/lib/cms/auth";
import { queryFirst } from "@/lib/cms/db";
import { jsonNoStore } from "@/lib/security";
import { CONTENT_TYPES } from "@/lib/cms/content";
import { listDocumentItems, loadOfficerContext, serializeDocument } from "@/lib/cms/document-store";
import { canSeeDocument, isDocumentType } from "@/lib/cms/documents";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gated = await requireAuth(request);
  if (!gated.ok) return gated.response;
  const { db, auth } = gated.ctx;
  const counts: Record<string, number> = {};

  for (const type of CONTENT_TYPES) {
    if (!can(auth, `${type}.view`)) continue;
    const row = await queryFirst<{ n: number }>(
      db,
      "SELECT COUNT(*) AS n FROM content_items WHERE type = ? AND deleted_at IS NULL",
      type,
    );
    counts[type] = row?.n ?? 0;
    const drafts = await queryFirst<{ n: number }>(
      db,
      "SELECT COUNT(*) AS n FROM content_items WHERE type = ? AND status IN ('draft', 'pending_review') AND deleted_at IS NULL",
      type,
    );
    counts[`${type}Drafts`] = drafts?.n ?? 0;
  }

  if (can(auth, "atelier.view")) {
    try {
      const products = await queryFirst<{ n: number }>(
        db,
        "SELECT COUNT(*) AS n FROM shop_products WHERE deleted_at IS NULL AND status != 'archived'",
      );
      if (products) counts.atelier = products.n;
      const open = await queryFirst<{ n: number }>(
        db,
        `SELECT COUNT(*) AS n FROM shop_orders
         WHERE status IN ('placed', 'awaiting_payment', 'paid', 'in_workshop', 'ready')`,
      );
      counts.shopOrders = open?.n ?? 0;
    } catch {
      /* migration 0004 may not be applied yet */
    }
  }

  if (can(auth, "media.view")) {
    const media = await queryFirst<{ n: number }>(db, "SELECT COUNT(*) AS n FROM media WHERE deleted_at IS NULL");
    counts.media = media?.n ?? 0;
  }
  if (can(auth, "users.view")) {
    const users = await queryFirst<{ n: number }>(db, "SELECT COUNT(*) AS n FROM users WHERE status = 'active'");
    counts.users = users?.n ?? 0;
  }

  const desk = await loadOfficerContext(db, auth);
  if (desk.allowed) {
    const rows = await listDocumentItems(db);
    const visible = rows.filter(
      (row) =>
        isDocumentType(row.type) &&
        canSeeDocument(desk.actor, desk.officers, { type: row.type, submitterId: row.submitter_id }),
    );
    const waiting = visible
      .map((row) => serializeDocument(row, desk.actor, desk.officers))
      .filter((item) => item.waitingOnYou && item.status !== "archived");
    counts.documents = waiting.length;
  }

  const activity = can(auth, "audit.view")
    ? await db
        .prepare(
          "SELECT id, action, resource_type, resource_id, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 12",
        )
        .all()
    : { results: [] };

  return jsonNoStore({
    ok: true,
    user: { name: auth.user.name, role: auth.user.role_name },
    counts,
    activity: activity.results ?? [],
  });
}
