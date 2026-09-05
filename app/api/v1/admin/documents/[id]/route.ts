import { apiError } from "@/lib/cms/guard";
import { requireDocumentsDesk } from "@/lib/cms/document-guard";
import {
  getDocumentComments,
  getDocumentEvents,
  getDocumentFiles,
  getDocumentItem,
  hasDocumentOpen,
  serializeDocument,
} from "@/lib/cms/document-store";
import { canSeeDocument, isDocumentType, OFFICER_LABELS, isDocumentOfficerRole } from "@/lib/cms/documents";
import { jsonNoStore } from "@/lib/security";

export const runtime = "nodejs";

function eventLabel(action: string) {
  switch (action) {
    case "submitted":
      return "Submitted";
    case "approved":
      return "Approved this stage";
    case "auto_approved":
      return "First stage recorded (submitter holds this office)";
    case "force_approved":
      return "Admin approved this stage";
    case "declined":
      return "Declined";
    case "changes_requested":
      return "Asked for changes";
    case "replaced":
      return "Replaced the file — chain started again";
    case "reopened":
      return "Reopened";
    case "archived":
      return "Archived";
    case "restored":
      return "Restored from archive";
    default:
      return action.replaceAll("_", " ");
  }
}

export async function GET(request: Request, context: RouteContext<"/api/v1/admin/documents/[id]">) {
  const { id } = await context.params;
  const gated = await requireDocumentsDesk(request);
  if (!gated.ok) return gated.response;
  const { db, actor, officers } = gated.ctx;
  const row = await getDocumentItem(db, id);
  if (!row || !isDocumentType(row.type)) return apiError(404, "Document not found.");
  if (!canSeeDocument(actor, officers, { type: row.type, submitterId: row.submitter_id })) {
    return apiError(404, "Document not found.");
  }

  const [events, comments, files, opened] = await Promise.all([
    getDocumentEvents(db, id),
    getDocumentComments(db, id),
    getDocumentFiles(db, id),
    hasDocumentOpen(db, id, actor.id, row.version),
  ]);

  return jsonNoStore({
    ok: true,
    item: serializeDocument(row, actor, officers, Date.now(), opened),
    events: events.map((event) => ({
      ...event,
      label: eventLabel(event.action),
      stageLabel: isDocumentOfficerRole(event.stage_role) ? OFFICER_LABELS[event.stage_role] : "",
      onBehalfLabel: isDocumentOfficerRole(event.on_behalf_of_role)
        ? OFFICER_LABELS[event.on_behalf_of_role]
        : "",
    })),
    comments,
    files: files.map((file) => ({
      id: file.id,
      version: file.version,
      name: file.file_name,
      mime: file.mime_type,
      size: file.size_bytes,
      createdAt: file.created_at,
    })),
  });
}
