import { apiError } from "@/lib/cms/guard";
import { requireDocumentsDesk } from "@/lib/cms/document-guard";
import { listActivePeople, saveOfficers } from "@/lib/cms/document-store";
import { DOCUMENT_OFFICER_ROLES, OFFICER_LABELS, isDocumentOfficerRole, isDocumentSuperAdmin } from "@/lib/cms/documents";
import { jsonNoStore } from "@/lib/security";
import { audit } from "@/lib/cms/audit";
import { parseBody, requestIp } from "@/lib/cms/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gated = await requireDocumentsDesk(request);
  if (!gated.ok) return gated.response;
  const { auth, actor, officerRows } = gated.ctx;
  const officers = officerRows.map((row) => ({
    role: row.role_key,
    label: isDocumentOfficerRole(row.role_key) ? OFFICER_LABELS[row.role_key] : row.role_key,
    userId: row.user_id,
    name: row.user_name,
    userRole: row.user_role,
  }));
  const people = isDocumentSuperAdmin(actor) ? await listActivePeople(gated.ctx.db) : [];
  return jsonNoStore({
    ok: true,
    officers,
    people,
    canEdit: isDocumentSuperAdmin(actor),
    user: { id: auth.user.id, name: auth.user.name },
  });
}

export async function PUT(request: Request) {
  const gated = await requireDocumentsDesk(request);
  if (!gated.ok) return gated.response;
  if (!isDocumentSuperAdmin(gated.ctx.actor)) {
    return apiError(403, "You cannot assign document officers.");
  }
  const body = await parseBody(request);
  if (!body.ok) return body.response;
  const incoming = body.data.officers;
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return apiError(400, "Officer assignments are required.");
  }
  const assignments: Partial<Record<(typeof DOCUMENT_OFFICER_ROLES)[number], string | null>> = {};
  for (const role of DOCUMENT_OFFICER_ROLES) {
    if (!(role in incoming)) continue;
    const value = (incoming as Record<string, unknown>)[role];
    if (value === null || value === "") {
      assignments[role] = null;
      continue;
    }
    if (typeof value !== "string") return apiError(400, "Each officer must be a person on the roster.");
    assignments[role] = value;
  }
  await saveOfficers(gated.ctx.db, assignments, gated.ctx.auth.user.id);
  await audit({
    db: gated.ctx.db,
    userId: gated.ctx.auth.user.id,
    action: "DOCUMENT_OFFICERS_UPDATED",
    resourceType: "document_officers",
    metadata: assignments,
    ip: requestIp(request),
  });
  return jsonNoStore({ ok: true });
}
