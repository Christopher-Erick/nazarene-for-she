import { getMediaBucket, newId, nowMs, run } from "@/lib/cms/db";

/** Images the site accepts for uploads (no SVG: it can carry script). */
export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
export const IMAGE_MAX_BYTES = 8 * 1024 * 1024;

export type StoredImage = { id: string; title: string; publicUrl: string; stored: boolean };

/**
 * Checks an uploaded image, puts it in the R2 media bucket and records it in the media library.
 * Served publicly at /api/v1/public/media/<id>.
 */
export async function storeImage(
  db: D1Database,
  file: unknown,
  meta: {
    userId: string;
    title?: string;
    description?: string;
    alt?: string;
    category?: string;
    associatedType?: string;
    associatedId?: string;
  },
): Promise<{ ok: true; image: StoredImage } | { ok: false; message: string }> {
  if (!(file instanceof File)) return { ok: false, message: "A file is required." };
  if (file.size > IMAGE_MAX_BYTES) return { ok: false, message: "Files must be 8MB or smaller." };
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { ok: false, message: "Only JPEG, PNG, WebP, GIF, and AVIF images are allowed." };
  const name = file.name.toLowerCase();
  if (name.endsWith(".svg") || name.endsWith(".html") || name.endsWith(".js") || name.includes("\0")) {
    return { ok: false, message: "That file type is not allowed." };
  }

  const bucket = await getMediaBucket();
  const id = newId();
  const key = `cms/${new Date().getUTCFullYear()}/${id}.${ext}`;
  if (bucket) {
    await bucket.put(key, new Uint8Array(await file.arrayBuffer()), { httpMetadata: { contentType: file.type } });
  }
  const publicUrl = bucket ? `/api/v1/public/media/${id}` : "";
  const title = String(meta.title || file.name).slice(0, 160);

  await run(
    db,
    `INSERT INTO media (
      id, title, description, alt_text, category, mime_type, extension, size_bytes, storage_key, public_url,
      associated_type, associated_id, uploaded_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    title,
    String(meta.description ?? "").slice(0, 400),
    String(meta.alt ?? "").slice(0, 200),
    String(meta.category ?? "").slice(0, 80),
    file.type,
    ext,
    file.size,
    key,
    publicUrl,
    String(meta.associatedType ?? "").slice(0, 40),
    String(meta.associatedId ?? "").slice(0, 80),
    meta.userId,
    nowMs(),
  );
  return { ok: true, image: { id, title, publicUrl, stored: Boolean(bucket) } };
}
