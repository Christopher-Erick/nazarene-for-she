import { apiError, requireAuth, requireAuthedMutation } from "@/lib/cms/guard";
import { loadOfficerContext, type OfficerRow } from "@/lib/cms/document-store";
import type { AuthContext } from "@/lib/cms/auth";
import type { DocumentActor, OfficerMap } from "@/lib/cms/documents";

export type DocumentsDeskContext = {
  db: D1Database;
  auth: AuthContext;
  actor: DocumentActor;
  officers: OfficerMap;
  officerRows: OfficerRow[];
};

export async function requireDocumentsDesk(request: Request) {
  const mutating = request.method !== "GET" && request.method !== "HEAD" && request.method !== "OPTIONS";
  const authed = mutating ? await requireAuthedMutation(request) : await requireAuth(request);
  if (!authed.ok) return authed;
  const desk = await loadOfficerContext(authed.ctx.db, authed.ctx.auth);
  if (!desk.allowed) {
    return { ok: false as const, response: apiError(403, "You do not have access to organisation documents.") };
  }
  return {
    ok: true as const,
    ctx: {
      db: authed.ctx.db,
      auth: authed.ctx.auth,
      actor: desk.actor,
      officers: desk.officers,
      officerRows: desk.rows,
    } satisfies DocumentsDeskContext,
  };
}
