import { queryAll, queryFirst, run, newId, nowMs } from "@/lib/cms/db";
import type { AuthContext } from "@/lib/cms/auth";
import {
  DOCUMENT_OFFICER_ROLES,
  DOCUMENT_TYPE_DEFS,
  OFFICER_LABELS,
  canOpenDocumentsDesk,
  canSeeDocument,
  canSeeDocumentType,
  canSubmitType,
  canEditType,
  chainProgress,
  documentStorageKey,
  documentStatusLabel,
  hasDocumentPermission,
  heldOfficerRoles,
  isDocumentOfficerRole,
  isDocumentType,
  isDocumentSuperAdmin,
  isOverdue,
  isStaleDocument,
  makeDocumentReference,
  publicDocumentTypes,
  submitterMayReplace,
  waitingOnActor,
  type DocumentActor,
  type DocumentEventDraft,
  type DocumentOfficerRole,
  type DocumentSnapshot,
  type DocumentStatus,
  type DocumentTypeSlug,
  type OfficerMap,
} from "@/lib/cms/documents";

export type OfficerRow = {
  role_key: string;
  user_id: string | null;
  user_name: string | null;
  user_role: string | null;
};

export type DocumentItemRow = {
  id: string;
  reference: string;
  type: string;
  title: string;
  status: string;
  current_stage_index: number;
  current_stage_role: string;
  submitter_id: string;
  submitter_name: string;
  due_at: number | null;
  version: number;
  decline_note: string;
  summary: string;
  summary_status: string;
  archived_at: number | null;
  created_at: number;
  updated_at: number;
  last_action_at: number;
  file_id: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
};

export type DocumentEventRow = {
  id: string;
  item_id: string;
  version: number;
  stage_role: string;
  stage_index: number | null;
  action: string;
  actor_id: string | null;
  actor_name: string;
  on_behalf_of_role: string;
  note: string;
  created_at: number;
};

export type DocumentCommentRow = {
  id: string;
  item_id: string;
  author_id: string | null;
  author_name: string | null;
  body: string;
  created_at: number;
};

export type DocumentFileRow = {
  id: string;
  item_id: string;
  version: number;
  storage_key: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string | null;
  created_at: number;
};

const ITEM_SELECT = `SELECT d.id, d.reference, d.type, d.title, d.status, d.current_stage_index,
  d.current_stage_role, d.submitter_id, u.name AS submitter_name, d.due_at, d.version,
  d.decline_note, d.summary, d.summary_status, d.archived_at, d.created_at, d.updated_at, d.last_action_at,
  f.id AS file_id, f.file_name, f.mime_type, f.size_bytes
 FROM document_items d
 JOIN users u ON u.id = d.submitter_id
 LEFT JOIN document_files f ON f.item_id = d.id AND f.version = d.version`;

export function actorFromAuth(auth: AuthContext): DocumentActor {
  return {
    id: auth.user.id,
    name: auth.user.name,
    role_slug: auth.user.role_slug,
    permissions: auth.permissions,
  };
}

export async function listOfficers(db: D1Database) {
  return queryAll<OfficerRow>(
    db,
    `SELECT o.role_key, o.user_id, u.name AS user_name, r.slug AS user_role
     FROM document_officers o
     LEFT JOIN users u ON u.id = o.user_id
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     ORDER BY o.role_key`,
  );
}

export function officerMapFrom(rows: OfficerRow[]): OfficerMap {
  const map: OfficerMap = {};
  for (const row of rows) {
    if (isDocumentOfficerRole(row.role_key)) map[row.role_key] = row.user_id;
  }
  return map;
}

export function officerUserIdsFrom(rows: OfficerRow[]) {
  return new Set(rows.map((row) => row.user_id).filter((id): id is string => Boolean(id)));
}

export async function loadOfficerContext(db: D1Database, auth: AuthContext) {
  const rows = await listOfficers(db);
  const officers = officerMapFrom(rows);
  const actor = actorFromAuth(auth);
  return {
    rows,
    officers,
    actor,
    allowed: canOpenDocumentsDesk(auth, officerUserIdsFrom(rows)),
  };
}

export function snapshotFromRow(row: DocumentItemRow): DocumentSnapshot {
  const type = isDocumentType(row.type) ? row.type : "requisition";
  return {
    type,
    status: row.status as DocumentStatus,
    currentStageIndex: Number(row.current_stage_index) || 0,
    currentStageRole: isDocumentOfficerRole(row.current_stage_role) ? row.current_stage_role : "",
    version: Number(row.version) || 1,
    updatedAt: Number(row.updated_at) || 0,
  };
}

export async function listDocumentItems(db: D1Database) {
  return queryAll<DocumentItemRow>(db, `${ITEM_SELECT} ORDER BY d.last_action_at DESC LIMIT 400`);
}

export async function getDocumentItem(db: D1Database, id: string) {
  return queryFirst<DocumentItemRow>(db, `${ITEM_SELECT} WHERE d.id = ?`, id);
}

export async function getDocumentEvents(db: D1Database, itemId: string) {
  return queryAll<DocumentEventRow>(
    db,
    `SELECT id, item_id, version, stage_role, stage_index, action, actor_id, actor_name,
            on_behalf_of_role, note, created_at
     FROM document_events WHERE item_id = ? ORDER BY created_at ASC`,
    itemId,
  );
}

export async function getDocumentComments(db: D1Database, itemId: string) {
  return queryAll<DocumentCommentRow>(
    db,
    `SELECT c.id, c.item_id, c.author_id, u.name AS author_name, c.body, c.created_at
     FROM document_comments c
     LEFT JOIN users u ON u.id = c.author_id
     WHERE c.item_id = ?
     ORDER BY c.created_at ASC`,
    itemId,
  );
}

export async function getDocumentFiles(db: D1Database, itemId: string) {
  return queryAll<DocumentFileRow>(
    db,
    `SELECT id, item_id, version, storage_key, file_name, mime_type, size_bytes, uploaded_by, created_at
     FROM document_files WHERE item_id = ? ORDER BY version DESC`,
    itemId,
  );
}

export async function getDocumentFile(db: D1Database, itemId: string, version?: number) {
  if (version) {
    return queryFirst<DocumentFileRow>(
      db,
      `SELECT id, item_id, version, storage_key, file_name, mime_type, size_bytes, uploaded_by, created_at
       FROM document_files WHERE item_id = ? AND version = ?`,
      itemId,
      version,
    );
  }
  return queryFirst<DocumentFileRow>(
    db,
    `SELECT f.id, f.item_id, f.version, f.storage_key, f.file_name, f.mime_type, f.size_bytes, f.uploaded_by, f.created_at
     FROM document_files f
     JOIN document_items d ON d.id = f.item_id AND d.version = f.version
     WHERE f.item_id = ?`,
    itemId,
  );
}

export async function insertDocument(
  db: D1Database,
  input: {
    type: DocumentTypeSlug;
    title: string;
    submitterId: string;
    dueAt: number | null;
    next: DocumentSnapshot;
    events: DocumentEventDraft[];
    actor: DocumentActor;
    file: { fileName: string; mime: string; ext: string; size: number };
  },
) {
  const id = newId();
  const now = input.next.updatedAt;
  const reference = makeDocumentReference(input.type, now, id);
  const storageKey = documentStorageKey(
    input.type,
    id,
    input.next.version,
    input.file.fileName,
    input.file.ext,
  );
  await run(
    db,
    `INSERT INTO document_items (
      id, reference, type, title, status, current_stage_index, current_stage_role,
      submitter_id, due_at, version, decline_note, archived_at, created_at, updated_at, last_action_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', NULL, ?, ?, ?)`,
    id,
    reference,
    input.type,
    input.title,
    input.next.status,
    input.next.currentStageIndex,
    input.next.currentStageRole,
    input.submitterId,
    input.dueAt,
    input.next.version,
    now,
    now,
    now,
  );
  const fileId = newId();
  await run(
    db,
    `INSERT INTO document_files (
      id, item_id, version, storage_key, file_name, mime_type, size_bytes, uploaded_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    fileId,
    id,
    input.next.version,
    storageKey,
    input.file.fileName,
    input.file.mime,
    input.file.size,
    input.submitterId,
    now,
  );
  await insertEvents(db, id, input.next.version, input.actor, input.events, now);
  return { id, reference, fileId, storageKey };
}

export async function applyDocumentDecision(
  db: D1Database,
  item: DocumentItemRow,
  next: DocumentSnapshot,
  actor: DocumentActor,
  events: DocumentEventDraft[],
  extra?: { declineNote?: string; archivedAt?: number | null },
) {
  const result = (await run(
    db,
    `UPDATE document_items
     SET status = ?, current_stage_index = ?, current_stage_role = ?, version = ?,
         decline_note = ?, archived_at = ?, updated_at = ?, last_action_at = ?
     WHERE id = ? AND updated_at = ?`,
    next.status,
    next.currentStageIndex,
    next.currentStageRole,
    next.version,
    extra?.declineNote ?? item.decline_note,
    extra?.archivedAt === undefined ? item.archived_at : extra.archivedAt,
    next.updatedAt,
    next.updatedAt,
    item.id,
    item.updated_at,
  )) as { meta?: { changes?: number } };
  const changed = typeof result.meta?.changes === "number" ? result.meta.changes : 1;
  if (!changed) return { ok: false as const, conflict: true };
  await insertEvents(db, item.id, next.version, actor, events, next.updatedAt);
  return { ok: true as const };
}

export async function insertReplacementFile(
  db: D1Database,
  itemId: string,
  version: number,
  actorId: string,
  file: { storageKey: string; fileName: string; mime: string; size: number },
  createdAt: number,
) {
  const fileId = newId();
  await run(
    db,
    `INSERT INTO document_files (
      id, item_id, version, storage_key, file_name, mime_type, size_bytes, uploaded_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    fileId,
    itemId,
    version,
    file.storageKey,
    file.fileName,
    file.mime,
    file.size,
    actorId,
    createdAt,
  );
  return fileId;
}

export async function saveDocumentSummary(
  db: D1Database,
  itemId: string,
  summary: string,
  status: "ready" | "failed" | "skipped" | "none",
) {
  await run(
    db,
    "UPDATE document_items SET summary = ?, summary_status = ? WHERE id = ?",
    summary,
    status,
    itemId,
  );
}

export async function recordDocumentOpen(db: D1Database, itemId: string, userId: string, version: number) {
  await run(
    db,
    `INSERT INTO document_reads (item_id, user_id, version, opened_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(item_id, user_id, version) DO UPDATE SET opened_at = excluded.opened_at`,
    itemId,
    userId,
    version,
    nowMs(),
  );
}

export async function hasDocumentOpen(db: D1Database, itemId: string, userId: string, version: number) {
  const row = await queryFirst<{ opened_at: number }>(
    db,
    "SELECT opened_at FROM document_reads WHERE item_id = ? AND user_id = ? AND version = ?",
    itemId,
    userId,
    version,
  );
  return Boolean(row);
}

export async function listDocumentOpens(db: D1Database, userId: string) {
  return queryAll<{ item_id: string; version: number }>(
    db,
    "SELECT item_id, version FROM document_reads WHERE user_id = ?",
    userId,
  );
}

export async function insertComment(db: D1Database, itemId: string, authorId: string, body: string) {
  const id = newId();
  const createdAt = nowMs();
  await run(
    db,
    "INSERT INTO document_comments (id, item_id, author_id, body, created_at) VALUES (?, ?, ?, ?, ?)",
    id,
    itemId,
    authorId,
    body,
    createdAt,
  );
  return { id, createdAt };
}

async function insertEvents(
  db: D1Database,
  itemId: string,
  version: number,
  actor: DocumentActor,
  events: DocumentEventDraft[],
  createdAt: number,
) {
  for (const item of events) {
    await run(
      db,
      `INSERT INTO document_events (
        id, item_id, version, stage_role, stage_index, action, actor_id, actor_name, on_behalf_of_role, note, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      newId(),
      itemId,
      version,
      item.stageRole,
      item.stageIndex,
      item.action,
      actor.id,
      actor.name,
      item.onBehalfOfRole,
      item.note,
      createdAt,
    );
  }
}

export async function saveOfficers(
  db: D1Database,
  assignments: Partial<Record<DocumentOfficerRole, string | null>>,
  actorId: string,
) {
  const now = nowMs();
  for (const role of DOCUMENT_OFFICER_ROLES) {
    if (!(role in assignments)) continue;
    await run(
      db,
      `INSERT INTO document_officers (role_key, user_id, updated_by, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(role_key) DO UPDATE SET user_id = excluded.user_id, updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
      role,
      assignments[role] ?? null,
      actorId,
      now,
    );
  }
}

export async function listDocumentWatchers(db: D1Database) {
  return queryAll<{ id: string; name: string; email: string }>(
    db,
    `SELECT DISTINCT u.id, u.name, u.email
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.id
     JOIN roles r ON r.id = ur.role_id
     WHERE u.status = 'active' AND (
       r.slug = 'super_admin'
       OR EXISTS (
         SELECT 1 FROM role_permissions rp
         WHERE rp.role_id = r.id AND rp.permission_id = 'documents.view'
       )
     )
     ORDER BY u.name ASC`,
  );
}

export async function peopleByIds(db: D1Database, ids: string[]) {
  const wanted = ids.filter(Boolean);
  if (!wanted.length) return [];
  const placeholders = wanted.map(() => "?").join(", ");
  return queryAll<{ id: string; name: string; email: string }>(
    db,
    `SELECT u.id, u.name, u.email FROM users u
     WHERE u.status = 'active' AND u.id IN (${placeholders})`,
    ...wanted,
  );
}

export async function listActivePeople(db: D1Database) {
  return queryAll<{ id: string; name: string; email: string; role_slug: string; role_name: string }>(
    db,
    `SELECT u.id, u.name, u.email, r.slug AS role_slug, r.name AS role_name
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.id
     JOIN roles r ON r.id = ur.role_id
     WHERE u.status = 'active'
     ORDER BY u.name ASC`,
  );
}

export function serializeDocument(
  row: DocumentItemRow,
  actor: DocumentActor,
  officers: OfficerMap,
  now = Date.now(),
  openedCurrent = false,
) {
  const type = isDocumentType(row.type) ? row.type : "requisition";
  const status = row.status as DocumentStatus;
  const currentRole = row.current_stage_role;
  const waiting = waitingOnActor(actor, officers, { status, currentStageRole: currentRole });
  const maySign =
    (isDocumentSuperAdmin(actor) || hasDocumentPermission(actor, "approve")) && waiting;
  const mayForce =
    isDocumentSuperAdmin(actor) && status === "pending" && !waiting;
  return {
    id: row.id,
    reference: row.reference,
    type,
    typeLabel: DOCUMENT_TYPE_DEFS[type].label,
    title: row.title,
    status,
    statusLabel: documentStatusLabel(status),
    currentStageIndex: Number(row.current_stage_index) || 0,
    currentStageRole: currentRole,
    currentStageLabel: isDocumentOfficerRole(currentRole) ? OFFICER_LABELS[currentRole] : "",
    submitterId: row.submitter_id,
    submitterName: row.submitter_name,
    dueAt: row.due_at,
    version: Number(row.version) || 1,
    declineNote: row.decline_note,
    summary: row.summary ?? "",
    summaryStatus: row.summary_status ?? "none",
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastActionAt: row.last_action_at,
    file: row.file_id
      ? {
          id: row.file_id,
          name: row.file_name,
          mime: row.mime_type,
          size: row.size_bytes,
        }
      : null,
    chain: chainProgress(type, status, Number(row.current_stage_index) || 0),
    waitingOnYou: waiting,
    stale: isStaleDocument({ status, lastActionAt: Number(row.last_action_at) || 0 }, now),
    overdue: isOverdue(row.due_at, now),
    hasOpenedCurrent: openedCurrent,
    mustOpenToDecide: status === "pending" && (maySign || mayForce),
    capabilities: {
      approve: maySign,
      forceApprove: mayForce,
      decline:
        (isDocumentSuperAdmin(actor) ||
          (hasDocumentPermission(actor, "approve") &&
            waitingOnActor(actor, officers, { status, currentStageRole: currentRole }))) &&
        status === "pending",
      requestChanges:
        (isDocumentSuperAdmin(actor) ||
          (hasDocumentPermission(actor, "approve") &&
            waitingOnActor(actor, officers, { status, currentStageRole: currentRole }))) &&
        status === "pending",
      replace: submitterMayReplace({ status, submitterId: row.submitter_id, type }, actor, officers),
      archive: (isDocumentSuperAdmin(actor) || hasDocumentPermission(actor, "delete")) && status !== "archived",
      restore: (isDocumentSuperAdmin(actor) || hasDocumentPermission(actor, "delete")) && status === "archived",
      reopen:
        (status === "declined" || status === "changes_requested") &&
        (isDocumentSuperAdmin(actor) || actor.id === row.submitter_id || canEditType(actor, officers, type)),
      comment: true,
    },
  };
}

export function deskMeta(auth: AuthContext, actor: DocumentActor, officers: OfficerMap) {
  return {
    types: publicDocumentTypes().filter((item) => canSeeDocumentType(actor, officers, item.slug)),
    submitTypes: publicDocumentTypes().filter((item) => canSubmitType(actor, officers, item.slug)),
    roles: heldOfficerRoles(actor, officers).map((role) => ({ role, label: OFFICER_LABELS[role] })),
    isSuperAdmin: isDocumentSuperAdmin(actor),
    canAssignOfficers: isDocumentSuperAdmin(actor),
    needsPatron: !officers.patron,
    user: { id: auth.user.id, name: auth.user.name, role: auth.user.role_name },
  };
}

export { canSeeDocument, canOpenDocumentsDesk, canSubmitType };
