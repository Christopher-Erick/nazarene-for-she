import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  approveStage,
  canOpenDocumentsDesk,
  canSeeDocumentType,
  canSubmitType,
  declineDocument,
  DOCUMENT_STALE_MS,
  documentStorageKey,
  forceApproveStage,
  holdsOfficerRole,
  isStaleDocument,
  replaceDocumentFile,
  requestChanges,
  startSubmission,
  waitingOnActor,
  decisionRequiresOpen,
  type DocumentActor,
  type OfficerMap,
} from "./documents.ts";
import type { PermissionKey } from "./permissions.ts";

const DOC_RIGHTS: PermissionKey[] = ["documents.view", "documents.create", "documents.approve"];

function actor(
  id: string,
  role_slug: DocumentActor["role_slug"],
  keys: PermissionKey[] = DOC_RIGHTS,
): DocumentActor {
  return { id, name: role_slug, role_slug, permissions: new Set(keys) };
}

const officers: OfficerMap = {
  chair: "chair-1",
  secretary: "sec-1",
  treasurer: "treas-1",
  patron: "patron-1",
  vice_secretary: "vsec-1",
  vice_chair: "vc-1",
};

describe("document approval desk", () => {
  it("stores each kind of paper under its own prefix", () => {
    assert.equal(
      documentStorageKey("requisition", "abc", 1, "quote.pdf", "pdf"),
      "documents/requisition/abc/v1/quote-pdf.pdf",
    );
    assert.ok(documentStorageKey("minutes", "abc", 2, "notes", "pdf").startsWith("documents/minutes/"));
    assert.ok(documentStorageKey("proof_of_payment", "abc", 1, "slip", "jpg").startsWith("documents/proof_of_payment/"));
  });

  it("keeps requisition, minutes, and proof-of-payment chains", () => {
    const now = 1_700_000_000_000;
    const chair = actor("chair-1", "chair");
    const secretary = actor("sec-1", "secretary");
    const treasurer = actor("treas-1", "treasurer");

    const requisition = startSubmission("requisition", chair, officers, now);
    assert.equal(requisition.ok, true);
    if (!requisition.ok) return;
    assert.equal(requisition.next.currentStageRole, "patron");
    assert.equal(requisition.events.some((event) => event.action === "auto_approved"), true);

    const minutes = startSubmission("minutes", secretary, officers, now);
    assert.equal(minutes.ok, true);
    if (!minutes.ok) return;
    assert.equal(minutes.next.currentStageRole, "vice_secretary");

    const proof = startSubmission("proof_of_payment", treasurer, officers, now);
    assert.equal(proof.ok, true);
    if (!proof.ok) return;
    assert.equal(proof.next.currentStageRole, "chair");
  });

  it("does not treat a website Chair as the document Chair until Super Admin assigns them", () => {
    const websiteChair = actor("someone-else", "chair");
    assert.equal(holdsOfficerRole(websiteChair, officers, "chair"), false);
    assert.equal(canSubmitType(websiteChair, officers, "requisition"), false);
    assert.equal(canOpenDocumentsDesk({ user: websiteChair, permissions: websiteChair.permissions }), true);
    assert.equal(
      canOpenDocumentsDesk({
        user: actor("member-2", "member", []),
        permissions: new Set(),
      }),
      false,
    );
  });

  it("does not let a secretary skip the chair on a requisition", () => {
    const secretary = actor("sec-1", "secretary");
    const started = startSubmission("requisition", secretary, officers, 1);
    assert.equal(started.ok, true);
    if (!started.ok) return;
    assert.equal(started.next.currentStageRole, "chair");
    const skipped = approveStage(started.next, secretary, officers, 2);
    assert.equal(skipped.ok, false);
  });

  it("locks signing until the current file has been opened", () => {
    assert.equal(decisionRequiresOpen("approve"), true);
    assert.equal(decisionRequiresOpen("decline"), true);
    assert.equal(decisionRequiresOpen("request_changes"), true);
    assert.equal(decisionRequiresOpen("force_approve"), true);
    assert.equal(decisionRequiresOpen("comment"), false);
    assert.equal(decisionRequiresOpen("archive"), false);
  });

  it("lets anyone with documents.view track every kind of paper", () => {
    const treasurer = actor("treas-1", "treasurer");
    const vice = actor("vc-1", "vice_chair");
    assert.equal(canSeeDocumentType(treasurer, officers, "minutes"), true);
    assert.equal(canSeeDocumentType(vice, officers, "requisition"), true);
    assert.equal(canSeeDocumentType(actor("admin-1", "admin", ["documents.view"]), officers, "minutes"), true);
    assert.equal(canSeeDocumentType(actor("root-1", "super_admin"), officers, "minutes"), true);
    assert.equal(canSeeDocumentType(actor("member-2", "member", []), officers, "requisition"), false);
  });

  it("treats Patron as an assigned person, not a website role", () => {
    const memberPatron = actor("patron-1", "member");
    const randomMember = actor("member-2", "member");
    assert.equal(holdsOfficerRole(memberPatron, officers, "patron"), true);
    assert.equal(holdsOfficerRole(randomMember, officers, "patron"), false);
    assert.equal(canSeeDocumentType(memberPatron, officers, "requisition"), true);
    assert.equal(canSeeDocumentType(randomMember, officers, "requisition"), true);
    assert.equal(canSubmitType(randomMember, officers, "requisition"), false);
    assert.equal(canSeeDocumentType(actor("member-3", "member", []), officers, "requisition"), false);
  });

  it("requires a note to decline and then stops the chain", () => {
    const chair = actor("chair-1", "chair");
    const started = startSubmission("requisition", actor("sec-1", "secretary"), officers, 1);
    assert.equal(started.ok, true);
    if (!started.ok) return;
    const missing = declineDocument(started.next, chair, officers, 2, "no");
    assert.equal(missing.ok, false);
    const declined = declineDocument(started.next, chair, officers, 2, "Missing quotations for this purchase.");
    assert.equal(declined.ok, true);
    if (!declined.ok) return;
    assert.equal(declined.next.status, "declined");
    assert.equal(declined.events[0].note, "Missing quotations for this purchase.");
  });

  it("requesting changes returns the file to the start of the chain", () => {
    const patron = actor("patron-1", "member");
    const started = startSubmission("requisition", actor("chair-1", "chair"), officers, 1);
    assert.equal(started.ok, true);
    if (!started.ok) return;
    const asked = requestChanges(started.next, patron, officers, 2, "Please attach the three quotations.");
    assert.equal(asked.ok, true);
    if (!asked.ok) return;
    assert.equal(asked.next.status, "changes_requested");
    assert.equal(asked.next.currentStageRole, "chair");
  });

  it("replacing a file increments the version and resets approvals", () => {
    const secretary = actor("sec-1", "secretary", [
      "documents.view",
      "documents.create",
      "documents.edit",
      "documents.approve",
    ]);
    const started = startSubmission("minutes", secretary, officers, 1);
    assert.equal(started.ok, true);
    if (!started.ok) return;
    const vice = actor("vsec-1", "vice_secretary");
    const approved = approveStage(started.next, vice, officers, 2);
    assert.equal(approved.ok, true);
    if (!approved.ok) return;
    assert.equal(approved.next.currentStageRole, "vice_chair");
    const replaced = replaceDocumentFile(approved.next, secretary, officers, "sec-1", 3, "Corrected attendance.");
    assert.equal(replaced.ok, true);
    if (!replaced.ok) return;
    assert.equal(replaced.next.version, 2);
    assert.equal(replaced.next.currentStageRole, "vice_secretary");
  });

  it("lets Super Admin force-approve in the current officer’s name", () => {
    const root = actor("root-1", "super_admin");
    const started = startSubmission("requisition", actor("sec-1", "secretary"), officers, 1);
    assert.equal(started.ok, true);
    if (!started.ok) return;
    const forced = forceApproveStage(started.next, root, 2, "Chair is travelling.");
    assert.equal(forced.ok, true);
    if (!forced.ok) return;
    assert.equal(forced.next.currentStageRole, "patron");
    assert.equal(forced.events[0].onBehalfOfRole, "chair");
    assert.equal(forceApproveStage(started.next, actor("admin-1", "admin"), 2, "no").ok, false);
    assert.equal(canSubmitType(actor("member-1", "member", []), officers, "requisition"), false);
  });

  it("marks a pending document stale after seven idle days", () => {
    const now = DOCUMENT_STALE_MS + 10;
    assert.equal(isStaleDocument({ status: "pending", lastActionAt: 0 }, now), true);
    assert.equal(isStaleDocument({ status: "approved", lastActionAt: 0 }, now), false);
    const chair = actor("chair-1", "chair");
    assert.equal(
      waitingOnActor(chair, officers, { status: "pending", currentStageRole: "chair" }),
      true,
    );
  });
});
