import { DOCUMENT_TYPE_DEFS, isDocumentOfficerRole, isDocumentType, type DocumentStatus, type OfficerMap } from "@/lib/cms/documents";
import { listDocumentWatchers, peopleByIds, type DocumentItemRow } from "@/lib/cms/document-store";
import { notifyDocumentDesk, type DocumentMailKind } from "@/lib/cms/document-mail";

export function mailKindForAction(action: string, status: DocumentStatus): DocumentMailKind | null {
  if (action === "comment") return "comment";
  if (action === "decline") return "declined";
  if (action === "request_changes") return "changes_requested";
  if (action === "replace" || action === "replaced") return "replaced";
  if (action === "reopen") return "submitted";
  if (action === "submitted") return status === "approved" ? "approved_final" : "submitted";
  if (action === "approve" || action === "force_approve") return status === "approved" ? "approved_final" : "approved";
  return null;
}

export async function notifyDocumentChange(input: {
  db: D1Database;
  officers: OfficerMap;
  item: Pick<DocumentItemRow, "id" | "reference" | "title" | "type" | "status" | "current_stage_role" | "summary">;
  actorName: string;
  actorEmail?: string;
  action: string;
  note?: string;
  summary?: string;
}) {
  try {
    const type = isDocumentType(input.item.type) ? input.item.type : null;
    if (!type) return;
    const status = input.item.status as DocumentStatus;
    const kind = mailKindForAction(input.action, status);
    if (!kind) return;

    const officerIds = Object.values(input.officers).filter((id): id is string => Boolean(id));
    const [watchers, officerPeople] = await Promise.all([
      listDocumentWatchers(input.db),
      peopleByIds(input.db, officerIds),
    ]);

    const currentRole = input.item.current_stage_role;
    const currentId = isDocumentOfficerRole(currentRole) ? input.officers[currentRole] : null;
    const urgent = currentId ? officerPeople.filter((person) => person.id === currentId) : [];

    await notifyDocumentDesk({
      itemId: input.item.id,
      reference: input.item.reference,
      title: input.item.title,
      typeLabel: DOCUMENT_TYPE_DEFS[type].label,
      status,
      currentStageRole: currentRole,
      actorName: input.actorName,
      actorEmail: input.actorEmail,
      note: input.note,
      summary: input.summary ?? input.item.summary,
      kind,
      watchers: [...watchers, ...officerPeople],
      urgent,
    });
  } catch (error) {
    console.error("[documents] notification skipped", error);
  }
}
