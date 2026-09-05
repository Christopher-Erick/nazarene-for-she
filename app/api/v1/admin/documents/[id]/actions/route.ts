import { apiError } from "@/lib/cms/guard";
import { requireDocumentsDesk, type DocumentsDeskContext } from "@/lib/cms/document-guard";
import {
  applyDocumentDecision,
  getDocumentItem,
  hasDocumentOpen,
  insertComment,
  insertReplacementFile,
  serializeDocument,
  snapshotFromRow,
} from "@/lib/cms/document-store";
import {
  acceptDocumentFile,
  archiveDocument,
  approveStage,
  canSeeDocument,
  declineDocument,
  decisionRequiresOpen,
  DOCUMENT_NOTE_MIN,
  DOCUMENT_TYPE_DEFS,
  documentStorageKey,
  forceApproveStage,
  isDocumentType,
  optimisticLockOk,
  reopenDocument,
  replaceDocumentFile,
  requestChanges,
  restoreDocument,
} from "@/lib/cms/documents";
import { getMediaBucket } from "@/lib/cms/db";
import { jsonNoStore } from "@/lib/security";
import { audit } from "@/lib/cms/audit";
import { parseBody, requestIp } from "@/lib/cms/http";
import { notifyDocumentChange } from "@/lib/cms/document-notify";
import { summariseDocumentFile } from "@/lib/cms/document-ai";

export const runtime = "nodejs";

export async function POST(request: Request, context: RouteContext<"/api/v1/admin/documents/[id]/actions">) {
  const { id } = await context.params;
  const gated = await requireDocumentsDesk(request);
  if (!gated.ok) return gated.response;
  const { db, auth, actor, officers } = gated.ctx;
  const row = await getDocumentItem(db, id);
  if (!row || !isDocumentType(row.type)) return apiError(404, "Document not found.");
  if (!canSeeDocument(actor, officers, { type: row.type, submitterId: row.submitter_id })) {
    return apiError(404, "Document not found.");
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    return replaceFile(request, id, gated.ctx, row);
  }

  const body = await parseBody(request);
  if (!body.ok) return body.response;
  const action = String(body.data.action ?? "");
  const note = String(body.data.note ?? "");
  const now = Date.now();
  const snap = snapshotFromRow(row);

  if (action === "comment") {
    const trimmed = note.trim();
    if (trimmed.length < DOCUMENT_NOTE_MIN) {
      return apiError(400, `A note of at least ${DOCUMENT_NOTE_MIN} characters is required.`);
    }
    await insertComment(db, id, actor.id, trimmed.slice(0, 2000));
    await notifyDocumentChange({
      db,
      officers,
      item: row,
      actorName: actor.name,
      actorEmail: auth.user.email,
      action: "comment",
      note: trimmed.slice(0, 2000),
    });
    return jsonNoStore({ ok: true });
  }

  if (!optimisticLockOk(body.data.expectedUpdatedAt, row.updated_at)) {
    return apiError(409, "This document changed while you were looking at it. Refresh and try again.");
  }

  if (decisionRequiresOpen(action) && !(await hasDocumentOpen(db, id, actor.id, row.version))) {
    return apiError(403, "Open and read the paper before you approve, decline, or ask for changes.");
  }

  let decision;
  let extra: { declineNote?: string; archivedAt?: number | null } | undefined;

  if (action === "approve") decision = approveStage(snap, actor, officers, now, note);
  else if (action === "force_approve") decision = forceApproveStage(snap, actor, now, note);
  else if (action === "decline") {
    decision = declineDocument(snap, actor, officers, now, note);
    extra = { declineNote: note.trim() };
  } else if (action === "request_changes") decision = requestChanges(snap, actor, officers, now, note);
  else if (action === "reopen") decision = reopenDocument(snap, actor, officers, row.submitter_id, now);
  else if (action === "archive") {
    decision = archiveDocument(snap, actor, now);
    extra = { archivedAt: now };
  } else if (action === "restore") {
    decision = restoreDocument(snap, actor, now);
    extra = { archivedAt: null };
  } else {
    return apiError(400, "Unknown action.");
  }

  if (!decision.ok) return apiError(400, decision.message);
  const applied = await applyDocumentDecision(db, row, decision.next, actor, decision.events, extra);
  if (!applied.ok) {
    return apiError(409, "This document changed while you were looking at it. Refresh and try again.");
  }

  if (action === "decline" || action === "request_changes") {
    const prefix = action === "decline" ? "Declined" : "Asked for changes";
    await insertComment(db, id, actor.id, `${prefix}: ${note.trim()}`.slice(0, 2000));
  }

  await audit({
    db,
    userId: auth.user.id,
    action: `DOCUMENT_${action.toUpperCase()}`,
    resourceType: "document",
    resourceId: id,
    metadata: { reference: row.reference, note: note.slice(0, 200) },
    ip: requestIp(request),
  });

  const fresh = await getDocumentItem(db, id);
  if (fresh) {
    await notifyDocumentChange({
      db,
      officers,
      item: fresh,
      actorName: actor.name,
      actorEmail: auth.user.email,
      action,
      note,
    });
  }
  const opened = fresh ? await hasDocumentOpen(db, id, actor.id, fresh.version) : false;
  return jsonNoStore({ ok: true, item: fresh ? serializeDocument(fresh, actor, officers, Date.now(), opened) : null });
}

async function replaceFile(
  request: Request,
  id: string,
  ctx: DocumentsDeskContext,
  row: NonNullable<Awaited<ReturnType<typeof getDocumentItem>>>,
) {
  const { db, auth, actor, officers } = ctx;
  const form = await request.formData();
  if (!optimisticLockOk(form.get("expectedUpdatedAt"), row.updated_at)) {
    return apiError(409, "This document changed while you were looking at it. Refresh and try again.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) return apiError(400, "Attach the replacement file.");
  const accepted = acceptDocumentFile(file);
  if (!accepted.ok) return apiError(400, accepted.message);
  const note = String(form.get("note") ?? "");
  const now = Date.now();
  const decision = replaceDocumentFile(snapshotFromRow(row), actor, officers, row.submitter_id, now, note);
  if (!decision.ok) return apiError(400, decision.message);

  const bucket = await getMediaBucket();
  if (!bucket) return apiError(503, "File storage is not configured yet.");

  const applied = await applyDocumentDecision(db, row, decision.next, actor, decision.events);
  if (!applied.ok) {
    return apiError(409, "This document changed while you were looking at it. Refresh and try again.");
  }

  const key = documentStorageKey(decision.next.type, id, decision.next.version, accepted.safeName, accepted.ext);
  const bytes = new Uint8Array(await file.arrayBuffer());
  await bucket.put(key, bytes, { httpMetadata: { contentType: accepted.mime } });
  await insertReplacementFile(
    db,
    id,
    decision.next.version,
    actor.id,
    { storageKey: key, fileName: accepted.safeName, mime: accepted.mime, size: file.size },
    now,
  );
  await summariseDocumentFile({
    db,
    itemId: id,
    title: row.title,
    typeLabel: DOCUMENT_TYPE_DEFS[decision.next.type].label,
    fileName: accepted.safeName,
    mime: accepted.mime,
    bytes,
  });

  await audit({
    db,
    userId: auth.user.id,
    action: "DOCUMENT_REPLACED",
    resourceType: "document",
    resourceId: id,
    metadata: { reference: row.reference, version: decision.next.version },
    ip: requestIp(request),
  });

  const fresh = await getDocumentItem(db, id);
  if (fresh) {
    await notifyDocumentChange({
      db,
      officers,
      item: fresh,
      actorName: actor.name,
      actorEmail: auth.user.email,
      action: "replaced",
      note,
    });
  }
  const opened = fresh ? await hasDocumentOpen(db, id, actor.id, fresh.version) : false;
  return jsonNoStore({ ok: true, item: fresh ? serializeDocument(fresh, actor, officers, Date.now(), opened) : null });
}
