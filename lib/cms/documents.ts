import { hasPermission, isSuperAdmin } from "./rbac.ts";
import { ROLE_LABELS, type PermissionKey, type RoleSlug } from "./permissions.ts";
import { slugify } from "./sanitize.ts";

export const DOCUMENT_TYPE_SLUGS = ["requisition", "minutes", "proof_of_payment"] as const;
export type DocumentTypeSlug = (typeof DOCUMENT_TYPE_SLUGS)[number];

export const DOCUMENT_STATUSES = [
  "pending",
  "changes_requested",
  "approved",
  "declined",
  "archived",
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const DOCUMENT_OFFICER_ROLES = [
  "chair",
  "vice_chair",
  "secretary",
  "vice_secretary",
  "treasurer",
  "patron",
] as const;
export type DocumentOfficerRole = (typeof DOCUMENT_OFFICER_ROLES)[number];

export const DOCUMENT_TYPE_DEFS = {
  requisition: {
    slug: "requisition",
    label: "Requisition",
    prefix: "REQ",
    submitRoles: ["chair", "secretary"],
    chain: ["chair", "patron", "treasurer"],
    editRoles: ["secretary", "patron"],
  },
  minutes: {
    slug: "minutes",
    label: "Minutes",
    prefix: "MIN",
    submitRoles: ["secretary"],
    chain: ["secretary", "vice_secretary", "vice_chair"],
    editRoles: ["secretary"],
  },
  proof_of_payment: {
    slug: "proof_of_payment",
    label: "Proof of payment",
    prefix: "POP",
    submitRoles: ["treasurer"],
    chain: ["treasurer", "chair", "patron"],
    editRoles: ["secretary"],
  },
} as const satisfies Record<
  DocumentTypeSlug,
  {
    slug: DocumentTypeSlug;
    label: string;
    prefix: string;
    submitRoles: readonly DocumentOfficerRole[];
    chain: readonly DocumentOfficerRole[];
    editRoles: readonly DocumentOfficerRole[];
  }
>;

export const DOCUMENT_STALE_MS = 7 * 24 * 60 * 60 * 1000;
export const DOCUMENT_NOTE_MIN = 8;
export const DOCUMENT_DECISION_ACTIONS = ["approve", "force_approve", "decline", "request_changes"] as const;

export function decisionRequiresOpen(action: string) {
  return (DOCUMENT_DECISION_ACTIONS as readonly string[]).includes(action);
}

export type OfficerMap = Partial<Record<DocumentOfficerRole, string | null>>;

export type DocumentActor = {
  id: string;
  name: string;
  role_slug: RoleSlug;
  permissions: Set<PermissionKey>;
};

function asPermissionActor(actor: DocumentActor) {
  return { user: { role_slug: actor.role_slug }, permissions: actor.permissions };
}

export function isDocumentSuperAdmin(actor: { role_slug: string }) {
  return actor.role_slug === "super_admin";
}

export function hasDocumentPermission(
  actor: DocumentActor,
  action: "view" | "create" | "edit" | "delete" | "approve",
) {
  return hasPermission(asPermissionActor(actor), `documents.${action}`);
}

/** Super Admin ticked view+create+edit+approve on a role — that role may operate the whole desk. */
export function isDocumentAdministrator(actor: DocumentActor) {
  if (isDocumentSuperAdmin(actor)) return true;
  return (
    hasDocumentPermission(actor, "view") &&
    hasDocumentPermission(actor, "create") &&
    hasDocumentPermission(actor, "edit") &&
    hasDocumentPermission(actor, "approve")
  );
}

export function documentStorageKey(
  type: DocumentTypeSlug,
  itemId: string,
  version: number,
  fileName: string,
  ext: string,
) {
  const safe = slugify(fileName) || "document";
  return `documents/${type}/${itemId}/v${version}/${safe}.${ext}`;
}

export type DocumentSnapshot = {
  type: DocumentTypeSlug;
  status: DocumentStatus;
  currentStageIndex: number;
  currentStageRole: DocumentOfficerRole | "";
  version: number;
  updatedAt: number;
};

export type DocumentEventDraft = {
  action: string;
  stageIndex: number | null;
  stageRole: string;
  note: string;
  onBehalfOfRole: string;
};

export type DocumentDecision =
  | { ok: false; message: string }
  | { ok: true; next: DocumentSnapshot; events: DocumentEventDraft[] };

export const OFFICER_LABELS: Record<DocumentOfficerRole, string> = {
  chair: ROLE_LABELS.chair,
  vice_chair: ROLE_LABELS.vice_chair,
  secretary: ROLE_LABELS.secretary,
  vice_secretary: ROLE_LABELS.vice_secretary,
  treasurer: ROLE_LABELS.treasurer,
  patron: "Patron",
};

export function isDocumentType(value: string): value is DocumentTypeSlug {
  return (DOCUMENT_TYPE_SLUGS as readonly string[]).includes(value);
}

export function isDocumentOfficerRole(value: string): value is DocumentOfficerRole {
  return (DOCUMENT_OFFICER_ROLES as readonly string[]).includes(value);
}

export function documentTypeDef(type: DocumentTypeSlug) {
  return DOCUMENT_TYPE_DEFS[type];
}

export function involvedRoles(type: DocumentTypeSlug): DocumentOfficerRole[] {
  const def = DOCUMENT_TYPE_DEFS[type];
  return [...new Set([...def.submitRoles, ...def.chain, ...def.editRoles])];
}

export function makeDocumentReference(type: DocumentTypeSlug, at: number, id: string) {
  const year = new Date(at).getUTCFullYear();
  const tail = id.replace(/-/g, "").slice(-4).toUpperCase();
  return `${DOCUMENT_TYPE_DEFS[type].prefix}-${year}-${tail}`;
}

export function holdsOfficerRole(
  actor: DocumentActor,
  officers: OfficerMap,
  role: DocumentOfficerRole,
) {
  return Boolean(officers[role] && officers[role] === actor.id);
}

export function heldOfficerRoles(actor: DocumentActor, officers: OfficerMap) {
  return DOCUMENT_OFFICER_ROLES.filter((role) => holdsOfficerRole(actor, officers, role));
}

export function canOpenDocumentsDesk(
  auth: { user: { id: string; role_slug: RoleSlug }; permissions: Set<PermissionKey> },
  _officerUserIds?: Iterable<string>,
) {
  if (isSuperAdmin(auth)) return true;
  return hasPermission(auth, "documents.view");
}

export function canSeeDocumentType(
  actor: DocumentActor,
  officers: OfficerMap,
  type: DocumentTypeSlug,
) {
  if (isDocumentSuperAdmin(actor) || hasDocumentPermission(actor, "view")) return true;
  return involvedRoles(type).some((role) => holdsOfficerRole(actor, officers, role));
}

export function canSeeDocument(
  actor: DocumentActor,
  officers: OfficerMap,
  item: { type: DocumentTypeSlug; submitterId: string },
) {
  if (isDocumentSuperAdmin(actor) || hasDocumentPermission(actor, "view")) return true;
  if (item.submitterId === actor.id) return true;
  return canSeeDocumentType(actor, officers, item.type);
}

export function canSubmitType(actor: DocumentActor, officers: OfficerMap, type: DocumentTypeSlug) {
  if (!hasDocumentPermission(actor, "create") && !isDocumentSuperAdmin(actor)) return false;
  if (isDocumentAdministrator(actor)) return true;
  return DOCUMENT_TYPE_DEFS[type].submitRoles.some((role) => holdsOfficerRole(actor, officers, role));
}

export function canEditType(actor: DocumentActor, officers: OfficerMap, type: DocumentTypeSlug) {
  if (!hasDocumentPermission(actor, "edit") && !isDocumentSuperAdmin(actor)) return false;
  if (isDocumentAdministrator(actor)) return true;
  return DOCUMENT_TYPE_DEFS[type].editRoles.some((role) => holdsOfficerRole(actor, officers, role));
}

export function waitingOnActor(
  actor: DocumentActor,
  officers: OfficerMap,
  item: { status: DocumentStatus; currentStageRole: string },
) {
  if (item.status !== "pending") return false;
  if (!isDocumentOfficerRole(item.currentStageRole)) return false;
  return holdsOfficerRole(actor, officers, item.currentStageRole);
}

export function isStaleDocument(item: { status: DocumentStatus; lastActionAt: number }, now: number) {
  return item.status === "pending" && now - item.lastActionAt >= DOCUMENT_STALE_MS;
}

export function isOverdue(dueAt: number | null | undefined, now: number) {
  return typeof dueAt === "number" && dueAt > 0 && dueAt < now;
}

export function chainProgress(
  type: DocumentTypeSlug,
  status: DocumentStatus,
  currentStageIndex: number,
) {
  const chain = DOCUMENT_TYPE_DEFS[type].chain;
  return chain.map((role, index) => {
    let state: "done" | "current" | "upcoming" | "stopped" = "upcoming";
    if (status === "approved") state = "done";
    else if (status === "declined" || status === "archived") {
      state = index < currentStageIndex ? "done" : index === currentStageIndex ? "stopped" : "upcoming";
    } else if (status === "changes_requested") {
      state = "upcoming";
    } else if (index < currentStageIndex) state = "done";
    else if (index === currentStageIndex) state = "current";
    return { role, label: OFFICER_LABELS[role], state, index };
  });
}

function requireNote(note: string) {
  const trimmed = note.trim();
  if (trimmed.length < DOCUMENT_NOTE_MIN) {
    return { ok: false as const, message: `A note of at least ${DOCUMENT_NOTE_MIN} characters is required.` };
  }
  return { ok: true as const, note: trimmed };
}

function snapshot(item: DocumentSnapshot, patch: Partial<DocumentSnapshot>, now: number): DocumentSnapshot {
  return { ...item, ...patch, updatedAt: now };
}

function event(
  action: string,
  item: DocumentSnapshot,
  note = "",
  onBehalfOfRole = "",
): DocumentEventDraft {
  return {
    action,
    stageIndex: item.currentStageRole ? item.currentStageIndex : null,
    stageRole: item.currentStageRole,
    note,
    onBehalfOfRole,
  };
}

export function startSubmission(
  type: DocumentTypeSlug,
  actor: DocumentActor,
  officers: OfficerMap,
  now: number,
): DocumentDecision {
  if (!canSubmitType(actor, officers, type)) {
    return { ok: false, message: "You cannot submit this kind of document." };
  }
  const chain = DOCUMENT_TYPE_DEFS[type].chain;
  let next: DocumentSnapshot = {
    type,
    status: "pending",
    currentStageIndex: 0,
    currentStageRole: chain[0],
    version: 1,
    updatedAt: now,
  };
  const events = [event("submitted", next)];
  if (holdsOfficerRole(actor, officers, chain[0])) {
    const advanced = advanceAfterApproval(next, now, "auto_approved");
    next = advanced.next;
    events.push(...advanced.events);
  }
  return { ok: true, next, events };
}

function advanceAfterApproval(item: DocumentSnapshot, now: number, action: string): {
  next: DocumentSnapshot;
  events: DocumentEventDraft[];
} {
  const events = [event(action, item)];
  const chain = DOCUMENT_TYPE_DEFS[item.type].chain;
  const nextIndex = item.currentStageIndex + 1;
  if (nextIndex >= chain.length) {
    return {
      next: snapshot(item, { status: "approved", currentStageIndex: chain.length, currentStageRole: "" }, now),
      events,
    };
  }
  return {
    next: snapshot(
      item,
      { status: "pending", currentStageIndex: nextIndex, currentStageRole: chain[nextIndex] },
      now,
    ),
    events,
  };
}

export function approveStage(
  item: DocumentSnapshot,
  actor: DocumentActor,
  officers: OfficerMap,
  now: number,
  note = "",
): DocumentDecision {
  if (item.status !== "pending" || !item.currentStageRole) {
    return { ok: false, message: "This document is not waiting for an approval." };
  }
  if (!isDocumentSuperAdmin(actor) && !hasDocumentPermission(actor, "approve")) {
    return { ok: false, message: "You do not have approval rights on documents." };
  }
  if (!holdsOfficerRole(actor, officers, item.currentStageRole)) {
    return { ok: false, message: "This stage is waiting on a different officer." };
  }
  const advanced = advanceAfterApproval(item, now, "approved");
  if (note.trim()) advanced.events[0].note = note.trim();
  return { ok: true, next: advanced.next, events: advanced.events };
}

export function forceApproveStage(
  item: DocumentSnapshot,
  actor: DocumentActor,
  now: number,
  note = "",
): DocumentDecision {
  if (!isDocumentSuperAdmin(actor)) {
    return { ok: false, message: "Only Super Admin can approve in an officer’s place." };
  }
  if (item.status !== "pending" || !item.currentStageRole) {
    return { ok: false, message: "This document is not waiting for an approval." };
  }
  const onBehalf = item.currentStageRole;
  const advanced = advanceAfterApproval(item, now, "force_approved");
  advanced.events[0].onBehalfOfRole = onBehalf;
  advanced.events[0].note = note.trim();
  return { ok: true, next: advanced.next, events: advanced.events };
}

export function declineDocument(
  item: DocumentSnapshot,
  actor: DocumentActor,
  officers: OfficerMap,
  now: number,
  rawNote: string,
): DocumentDecision {
  if (item.status !== "pending") {
    return { ok: false, message: "Only a document waiting for approval can be declined." };
  }
  const note = requireNote(rawNote);
  if (!note.ok) return note;
  const mayAct =
    isDocumentSuperAdmin(actor) ||
    (hasDocumentPermission(actor, "approve") &&
      Boolean(item.currentStageRole && holdsOfficerRole(actor, officers, item.currentStageRole)));
  if (!mayAct) {
    return { ok: false, message: "You cannot decline this document." };
  }
  return {
    ok: true,
    next: snapshot(item, { status: "declined" }, now),
    events: [event("declined", item, note.note)],
  };
}

export function requestChanges(
  item: DocumentSnapshot,
  actor: DocumentActor,
  officers: OfficerMap,
  now: number,
  rawNote: string,
): DocumentDecision {
  if (item.status !== "pending") {
    return { ok: false, message: "Changes can only be requested while a document is in the chain." };
  }
  const note = requireNote(rawNote);
  if (!note.ok) return note;
  const mayAct =
    isDocumentSuperAdmin(actor) ||
    (hasDocumentPermission(actor, "approve") &&
      Boolean(item.currentStageRole && holdsOfficerRole(actor, officers, item.currentStageRole)));
  if (!mayAct) {
    return { ok: false, message: "You cannot request changes on this document." };
  }
  const chain = DOCUMENT_TYPE_DEFS[item.type].chain;
  return {
    ok: true,
    next: snapshot(item, { status: "changes_requested", currentStageIndex: 0, currentStageRole: chain[0] }, now),
    events: [event("changes_requested", item, note.note)],
  };
}

export function replaceDocumentFile(
  item: DocumentSnapshot,
  actor: DocumentActor,
  officers: OfficerMap,
  submitterId: string,
  now: number,
  note = "",
): DocumentDecision {
  if (item.status === "archived") {
    return { ok: false, message: "Archived documents cannot be replaced." };
  }
  if (!submitterMayReplace({ status: item.status, submitterId, type: item.type }, actor, officers)) {
    return { ok: false, message: "You cannot replace this file." };
  }
  const chain = DOCUMENT_TYPE_DEFS[item.type].chain;
  let next: DocumentSnapshot = snapshot(
    item,
    {
      status: "pending",
      currentStageIndex: 0,
      currentStageRole: chain[0],
      version: item.version + 1,
    },
    now,
  );
  const events = [event("replaced", { ...next, version: item.version }, note.trim())];
  if (holdsOfficerRole(actor, officers, chain[0])) {
    const advanced = advanceAfterApproval(next, now, "auto_approved");
    next = advanced.next;
    events.push(...advanced.events);
  }
  return { ok: true, next, events };
}

export function submitterMayReplace(
  item: { status: DocumentStatus; submitterId: string; type: DocumentTypeSlug },
  actor: DocumentActor,
  officers: OfficerMap,
) {
  if (item.status === "archived") return false;
  if (canEditType(actor, officers, item.type)) return true;
  if (!isDocumentSuperAdmin(actor) && !hasDocumentPermission(actor, "create") && !hasDocumentPermission(actor, "edit")) {
    return false;
  }
  return item.submitterId === actor.id && (item.status === "changes_requested" || item.status === "declined" || item.status === "pending");
}

export function reopenDocument(
  item: DocumentSnapshot,
  actor: DocumentActor,
  officers: OfficerMap,
  submitterId: string,
  now: number,
): DocumentDecision {
  if (item.status !== "declined" && item.status !== "changes_requested") {
    return { ok: false, message: "Only a declined document or one with requested changes can be reopened." };
  }
  if (
    !isDocumentSuperAdmin(actor) &&
    actor.id !== submitterId &&
    !canEditType(actor, officers, item.type)
  ) {
    return { ok: false, message: "You cannot reopen this document." };
  }
  const chain = DOCUMENT_TYPE_DEFS[item.type].chain;
  return {
    ok: true,
    next: snapshot(item, { status: "pending", currentStageIndex: 0, currentStageRole: chain[0] }, now),
    events: [event("reopened", item)],
  };
}

export function archiveDocument(item: DocumentSnapshot, actor: DocumentActor, now: number): DocumentDecision {
  if (!isDocumentSuperAdmin(actor) && !hasDocumentPermission(actor, "delete")) {
    return { ok: false, message: "You do not have the right to archive documents." };
  }
  if (item.status === "archived") {
    return { ok: false, message: "This document is already archived." };
  }
  return {
    ok: true,
    next: snapshot(item, { status: "archived" }, now),
    events: [event("archived", item)],
  };
}

export function restoreDocument(item: DocumentSnapshot, actor: DocumentActor, now: number): DocumentDecision {
  if (!isDocumentSuperAdmin(actor) && !hasDocumentPermission(actor, "delete")) {
    return { ok: false, message: "You do not have the right to restore documents." };
  }
  if (item.status !== "archived") {
    return { ok: false, message: "This document is not archived." };
  }
  const chain = DOCUMENT_TYPE_DEFS[item.type].chain;
  return {
    ok: true,
    next: snapshot(
      item,
      {
        status: "pending",
        currentStageIndex: 0,
        currentStageRole: chain[0] ?? "",
      },
      now,
    ),
    events: [event("restored", { ...item, currentStageIndex: 0, currentStageRole: chain[0] ?? "" })],
  };
}

export function optimisticLockOk(expectedUpdatedAt: unknown, actual: number) {
  const expected = Number(expectedUpdatedAt);
  if (!Number.isFinite(expected)) return false;
  return expected === actual;
}

export const DOCUMENT_FILE_MAX_BYTES = 15 * 1024 * 1024;

export const DOCUMENT_ALLOWED_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xls",
  "text/csv": "csv",
};

const DANGEROUS_NAME = /(\.svg|\.html?|\.jsx?|\.tsx?|\.exe|\.bat|\.cmd|\.php|\.sh)(\.|$)/i;

export function acceptDocumentFile(file: File) {
  if (file.size <= 0) return { ok: false as const, message: "The file is empty." };
  if (file.size > DOCUMENT_FILE_MAX_BYTES) {
    return { ok: false as const, message: "Files must be 15MB or smaller." };
  }
  const name = file.name.toLowerCase();
  if (name.includes("\0") || DANGEROUS_NAME.test(name)) {
    return { ok: false as const, message: "That file type is not allowed." };
  }
  const mime = file.type;
  const ext = DOCUMENT_ALLOWED_MIME[mime];
  if (!ext) {
    return { ok: false as const, message: "Upload a PDF, image, Word, Excel, or CSV file." };
  }
  const safeName = file.name.replace(/[/\\]+/g, "").replace(/[^\w.\- ()]+/g, "_").slice(0, 160) || `document.${ext}`;
  return { ok: true as const, mime, ext, safeName };
}

export function documentStatusLabel(status: DocumentStatus) {
  switch (status) {
    case "pending":
      return "In the chain";
    case "changes_requested":
      return "Changes requested";
    case "approved":
      return "Approved";
    case "declined":
      return "Declined";
    case "archived":
      return "Archived";
    default:
      return status;
  }
}

export function documentStatusTone(status: DocumentStatus) {
  switch (status) {
    case "approved":
      return "is-live";
    case "pending":
      return "is-review";
    case "changes_requested":
      return "is-ready";
    case "declined":
      return "is-off";
    case "archived":
      return "is-draft";
    default:
      return "is-draft";
  }
}

export function waitingLabel(role: string) {
  if (!isDocumentOfficerRole(role)) return "Waiting";
  return `Waiting on ${OFFICER_LABELS[role]}`;
}

export function publicDocumentTypes() {
  return DOCUMENT_TYPE_SLUGS.map((slug) => {
    const def = DOCUMENT_TYPE_DEFS[slug];
    return {
      slug,
      label: def.label,
      chain: def.chain.map((role) => ({ role, label: OFFICER_LABELS[role] })),
      submitRoles: def.submitRoles.map((role) => ({ role, label: OFFICER_LABELS[role] })),
      editRoles: def.editRoles.map((role) => ({ role, label: OFFICER_LABELS[role] })),
    };
  });
}
