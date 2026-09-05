import { apiError } from "@/lib/cms/guard";
import { requireDocumentsDesk } from "@/lib/cms/document-guard";
import { getDocumentFile, getDocumentItem, recordDocumentOpen } from "@/lib/cms/document-store";
import { canSeeDocument, isDocumentType } from "@/lib/cms/documents";
import { getMediaBucket } from "@/lib/cms/db";

export const runtime = "nodejs";

export async function GET(request: Request, context: RouteContext<"/api/v1/admin/documents/[id]/file">) {
  const { id } = await context.params;
  const gated = await requireDocumentsDesk(request);
  if (!gated.ok) return gated.response;
  const { db, actor, officers } = gated.ctx;
  const row = await getDocumentItem(db, id);
  if (!row || !isDocumentType(row.type)) return apiError(404, "Document not found.");
  if (!canSeeDocument(actor, officers, { type: row.type, submitterId: row.submitter_id })) {
    return apiError(404, "Document not found.");
  }

  const url = new URL(request.url);
  const versionRaw = url.searchParams.get("version");
  const version = versionRaw ? Number(versionRaw) : undefined;
  const file = await getDocumentFile(db, id, Number.isFinite(version) ? version : undefined);
  if (!file) return apiError(404, "File not found.");

  const bucket = await getMediaBucket();
  if (!bucket) return apiError(503, "File storage is not configured yet.");
  const object = await bucket.get(file.storage_key);
  if (!object) return apiError(404, "File not found.");
  if (file.version === row.version) {
    await recordDocumentOpen(db, id, actor.id, file.version);
  }

  const download = url.searchParams.get("download") === "1";
  const filename = file.file_name.replace(/[\r\n"]/g, "");
  return new Response(object.body, {
    headers: {
      "Content-Type": file.mime_type,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
