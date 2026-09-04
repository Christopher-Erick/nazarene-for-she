import { requirePermission, apiError } from "@/lib/cms/guard";
import { getMediaBucket } from "@/lib/cms/db";
import { queryAll, run, newId, nowMs } from "@/lib/cms/db";
import { jsonNoStore } from "@/lib/security";
import { audit } from "@/lib/cms/audit";
import { requestIp } from "@/lib/cms/http";
import { slugify } from "@/lib/cms/sanitize";

export const runtime = "nodejs";

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
const MAX_BYTES = 8 * 1024 * 1024;

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
  if (!(file instanceof File)) return apiError(400, "A file is required.");
  if (file.size > MAX_BYTES) return apiError(400, "Files must be 8MB or smaller.");
  const mime = file.type;
  const ext = ALLOWED[mime];
  if (!ext) return apiError(400, "Only JPEG, PNG, WebP, GIF, and AVIF images are allowed.");
  const name = file.name.toLowerCase();
  if (name.endsWith(".svg") || name.endsWith(".html") || name.endsWith(".js") || name.includes("\0")) {
    return apiError(400, "That file type is not allowed.");
  }

  const bucket = await getMediaBucket();
  const id = newId();
  const key = `cms/${new Date().getUTCFullYear()}/${id}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  let publicUrl = `/api/v1/public/media/${id}`;
  if (bucket) {
    await bucket.put(key, bytes, { httpMetadata: { contentType: mime } });
  } else {
    publicUrl = "";
  }

  const title = String(form.get("title") ?? file.name).slice(0, 160);
  await run(
    gated.ctx.db,
    `INSERT INTO media (
      id, title, description, alt_text, category, mime_type, extension, size_bytes, storage_key, public_url,
      associated_type, associated_id, uploaded_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    title,
    String(form.get("description") ?? "").slice(0, 400),
    String(form.get("alt") ?? "").slice(0, 200),
    String(form.get("category") ?? "").slice(0, 80),
    mime,
    ext,
    file.size,
    key,
    publicUrl,
    String(form.get("associatedType") ?? "").slice(0, 40),
    String(form.get("associatedId") ?? "").slice(0, 80),
    gated.ctx.auth.user.id,
    nowMs(),
  );

  await audit({
    db: gated.ctx.db,
    userId: gated.ctx.auth.user.id,
    action: "MEDIA_UPLOADED",
    resourceType: "media",
    resourceId: id,
    metadata: { mime, size: file.size, name: slugify(file.name) },
    ip: requestIp(request),
  });

  if (!bucket) {
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
