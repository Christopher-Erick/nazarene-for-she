import { apiError } from "@/lib/cms/guard";
import { requireDocumentsDesk } from "@/lib/cms/document-guard";
import {
  deskMeta,
  getDocumentItem,
  insertDocument,
  listDocumentItems,
  listDocumentOpens,
  serializeDocument,
} from "@/lib/cms/document-store";
import {
  acceptDocumentFile,
  canSeeDocument,
  canSubmitType,
  DOCUMENT_TYPE_DEFS,
  isDocumentType,
  startSubmission,
} from "@/lib/cms/documents";
import { getMediaBucket } from "@/lib/cms/db";
import { jsonNoStore } from "@/lib/security";
import { audit } from "@/lib/cms/audit";
import { requestIp } from "@/lib/cms/http";
import { notifyDocumentChange } from "@/lib/cms/document-notify";
import { summariseDocumentFile } from "@/lib/cms/document-ai";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gated = await requireDocumentsDesk(request);
  if (!gated.ok) return gated.response;
  const { db, auth, actor, officers } = gated.ctx;
  const url = new URL(request.url);
  const view = url.searchParams.get("view") ?? "all";
  const typeFilter = url.searchParams.get("type") ?? "";
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();

  const rows = await listDocumentItems(db);
  const opens = await listDocumentOpens(db, actor.id);
  const opened = new Set(opens.map((item) => `${item.item_id}:${item.version}`));
  const visible = rows.filter((row) => {
    if (!isDocumentType(row.type)) return false;
    if (!canSeeDocument(actor, officers, { type: row.type, submitterId: row.submitter_id })) return false;
    if (typeFilter && row.type !== typeFilter) return false;
    if (q) {
      const hay = `${row.title} ${row.reference} ${row.submitter_name}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const items = visible.map((row) =>
    serializeDocument(row, actor, officers, Date.now(), opened.has(`${row.id}:${row.version}`)),
  );
  const inbox = items.filter((item) => item.waitingOnYou && item.status !== "archived");
  const open = items.filter((item) => item.status !== "archived");
  const archived = items.filter((item) => item.status === "archived");
  const stale = open.filter((item) => item.stale);

  const selected =
    view === "archived" ? archived : view === "all" ? open : view === "stale" ? stale : inbox;

  return jsonNoStore({
    ok: true,
    items: selected,
    counts: {
      inbox: inbox.length,
      all: open.length,
      stale: stale.length,
      archived: archived.length,
      byType: {
        requisition: open.filter((item) => item.type === "requisition").length,
        minutes: open.filter((item) => item.type === "minutes").length,
        proof_of_payment: open.filter((item) => item.type === "proof_of_payment").length,
      },
    },
    desk: deskMeta(auth, actor, officers),
  });
}

export async function POST(request: Request) {
  const gated = await requireDocumentsDesk(request);
  if (!gated.ok) return gated.response;
  const { db, auth, actor, officers } = gated.ctx;

  const form = await request.formData();
  const typeRaw = String(form.get("type") ?? "");
  if (!isDocumentType(typeRaw)) return apiError(400, "Choose a document type.");
  if (!canSubmitType(actor, officers, typeRaw)) {
    return apiError(403, "You cannot submit this kind of document.");
  }

  const title = String(form.get("title") ?? "").trim().slice(0, 180);
  if (title.length < 3) return apiError(400, "Give the document a clear title.");

  const dueRaw = String(form.get("dueAt") ?? "").trim();
  let dueAt: number | null = null;
  if (dueRaw) {
    const parsed = Date.parse(dueRaw);
    if (!Number.isFinite(parsed)) return apiError(400, "The due date is not valid.");
    dueAt = parsed;
  }

  const file = form.get("file");
  if (!(file instanceof File)) return apiError(400, "Attach the document file.");
  const accepted = acceptDocumentFile(file);
  if (!accepted.ok) return apiError(400, accepted.message);

  const bucket = await getMediaBucket();
  if (!bucket) return apiError(503, "File storage is not configured yet.");

  const now = Date.now();
  const started = startSubmission(typeRaw, actor, officers, now);
  if (!started.ok) return apiError(403, started.message);

  const created = await insertDocument(db, {
    type: typeRaw,
    title,
    submitterId: actor.id,
    dueAt,
    next: started.next,
    events: started.events,
    actor,
    file: {
      fileName: accepted.safeName,
      mime: accepted.mime,
      ext: accepted.ext,
      size: file.size,
    },
  });

  const bytes = new Uint8Array(await file.arrayBuffer());
  await bucket.put(created.storageKey, bytes, { httpMetadata: { contentType: accepted.mime } });
  await summariseDocumentFile({
    db,
    itemId: created.id,
    title,
    typeLabel: DOCUMENT_TYPE_DEFS[typeRaw].label,
    fileName: accepted.safeName,
    mime: accepted.mime,
    bytes,
  });

  await audit({
    db,
    userId: auth.user.id,
    action: "DOCUMENT_SUBMITTED",
    resourceType: "document",
    resourceId: created.id,
    metadata: { type: typeRaw, reference: created.reference, name: accepted.safeName },
    ip: requestIp(request),
  });

  const row = await getDocumentItem(db, created.id);
  if (row) {
    await notifyDocumentChange({
      db,
      officers,
      item: row,
      actorName: actor.name,
      actorEmail: auth.user.email,
      action: "submitted",
    });
  }
  return jsonNoStore(
    {
      ok: true,
      item: row ? serializeDocument(row, actor, officers) : { id: created.id, reference: created.reference },
    },
    { status: 201 },
  );
}
