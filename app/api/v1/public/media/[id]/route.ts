import { getDb, queryFirst } from "@/lib/cms/db";
import { getMediaBucket } from "@/lib/cms/db";

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext<"/api/v1/public/media/[id]">) {
  const { id } = await context.params;
  const db = await getDb();
  if (!db) return new Response("Not found.", { status: 404 });
  const row = await queryFirst<{ storage_key: string; mime_type: string; deleted_at: number | null }>(
    db,
    "SELECT storage_key, mime_type, deleted_at FROM media WHERE id = ?",
    id,
  );
  if (!row || row.deleted_at) return new Response("Not found.", { status: 404 });
  const bucket = await getMediaBucket();
  if (!bucket) return new Response("Not found.", { status: 404 });
  const object = await bucket.get(row.storage_key);
  if (!object) return new Response("Not found.", { status: 404 });
  return new Response(object.body, {
    headers: {
      "Content-Type": row.mime_type,
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
