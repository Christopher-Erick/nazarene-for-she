import { apiError } from "@/lib/cms/guard";
import { requireDocumentsDesk } from "@/lib/cms/document-guard";
import { getDocumentItem } from "@/lib/cms/document-store";
import { canSeeDocument, isDocumentType } from "@/lib/cms/documents";
import { summariseStoredDocument } from "@/lib/cms/document-ai";
import { jsonNoStore } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const gated = await requireDocumentsDesk(request);
  if (!gated.ok) return gated.response;
  const { db, actor, officers } = gated.ctx;
  const row = await getDocumentItem(db, id);
  if (!row || !isDocumentType(row.type)) return apiError(404, "Document not found.");
  if (!canSeeDocument(actor, officers, { type: row.type, submitterId: row.submitter_id })) {
    return apiError(404, "Document not found.");
  }

  const summary = await summariseStoredDocument(db, id);
  const fresh = await getDocumentItem(db, id);
  return jsonNoStore({
    ok: true,
    summary,
    summaryStatus: fresh?.summary_status ?? (summary ? "ready" : "failed"),
  });
}
