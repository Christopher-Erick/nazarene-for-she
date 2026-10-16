import { requirePermission, apiError } from "@/lib/cms/guard";
import { queryAll, run, nowMs } from "@/lib/cms/db";
import { storeImage } from "@/lib/cms/media-store";
import { jsonNoStore } from "@/lib/security";
import { audit } from "@/lib/cms/audit";
import { requestIp } from "@/lib/cms/http";
import { slugify } from "@/lib/cms/sanitize";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gated = await requirePermission(request, "media.view");
  if (!gated.ok) return gated.response;
  const items = await queryAll(
    gated.ctx.db,
    `SELECT id, title, description, alt_text, category, mime_type, size_bytes, public_url, associated_type, associated_id, created_at
     FROM media WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 100`,
  );
  return jsonNoStore({ ok: true, items });
}

export async function POST(request: Request) {
  const gated = await requirePermission(request, "media.create");
  if (!gated.ok) return gated.response;

  const form = await request.formData();
  const file = form.get("file");
  const stored = await storeImage(gated.ctx.db, file, {
    userId: gated.ctx.auth.user.id,
    title: String(form.get("title") ?? ""),
    description: String(form.get("description") ?? ""),
    alt: String(form.get("alt") ?? ""),
    category: String(form.get("category") ?? ""),
    associatedType: String(form.get("associatedType") ?? ""),
    associatedId: String(form.get("associatedId") ?? ""),
  });
  if (!stored.ok) return apiError(400, stored.message);
  const { id, title, publicUrl } = stored.image;
  const upload = file as File;

  await audit({
    db: gated.ctx.db,
    userId: gated.ctx.auth.user.id,
    action: "MEDIA_UPLOADED",
    resourceType: "media",
    resourceId: id,
    metadata: { mime: upload.type, size: upload.size, name: slugify(upload.name) },
    ip: requestIp(request),
  });

  if (!stored.image.stored) {
    return jsonNoStore(
      { ok: true, item: { id, title, publicUrl }, warning: "R2 is not bound. Metadata was stored, but the file was not saved." },
      { status: 201 },
    );
  }
  return jsonNoStore({ ok: true, item: { id, title, publicUrl } }, { status: 201 });
}

export async function DELETE(request: Request) {
  const gated = await requirePermission(request, "media.delete");
  if (!gated.ok) return gated.response;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return apiError(400, "Media id is required.");
  await run(gated.ctx.db, "UPDATE media SET deleted_at = ? WHERE id = ?", nowMs(), id);
  await audit({
    db: gated.ctx.db,
    userId: gated.ctx.auth.user.id,
    action: "MEDIA_DELETED",
    resourceType: "media",
    resourceId: id,
    ip: requestIp(request),
  });
  return jsonNoStore({ ok: true });
}
