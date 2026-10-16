import { apiError, requirePermission } from "@/lib/cms/guard";
import { getSetting, setSetting } from "@/lib/cms/settings";
import { LEADERSHIP_SETTING_KEY, normalizeLeadership } from "@/lib/cms/leadership";
import { storeImage } from "@/lib/cms/media-store";
import { audit } from "@/lib/cms/audit";
import { parseBody, requestIp } from "@/lib/cms/http";
import { jsonNoStore } from "@/lib/security";

export const runtime = "nodejs";

/** The leadership team as stored (cleaned). */
export async function GET(request: Request) {
  const gated = await requirePermission(request, "organization.view");
  if (!gated.ok) return gated.response;
  const members = normalizeLeadership(await getSetting<unknown>(LEADERSHIP_SETTING_KEY, []));
  return jsonNoStore({ ok: true, members });
}

/** Replace the whole team (order included). */
export async function PUT(request: Request) {
  const gated = await requirePermission(request, "organization.edit");
  if (!gated.ok) return gated.response;
  const body = await parseBody(request);
  if (!body.ok) return body.response;
  const members = normalizeLeadership(body.data.members);
  await setSetting(gated.ctx.db, LEADERSHIP_SETTING_KEY, members, gated.ctx.auth.user.id);
  await audit({
    db: gated.ctx.db,
    userId: gated.ctx.auth.user.id,
    action: "LEADERSHIP_UPDATED",
    resourceType: "settings",
    resourceId: LEADERSHIP_SETTING_KEY,
    metadata: { members: members.length },
    ip: requestIp(request),
  });
  return jsonNoStore({ ok: true, members });
}

/** Upload one portrait; returns the address to put on a member. */
export async function POST(request: Request) {
  const gated = await requirePermission(request, "organization.edit");
  if (!gated.ok) return gated.response;
  const form = await request.formData();
  const name = String(form.get("name") ?? "").slice(0, 80);
  const stored = await storeImage(gated.ctx.db, form.get("file"), {
    userId: gated.ctx.auth.user.id,
    title: name ? `Portrait: ${name}` : "Leadership portrait",
    alt: name ? `Portrait of ${name}` : "",
    category: "leadership",
    associatedType: "leadership",
  });
  if (!stored.ok) return apiError(400, stored.message);
  if (!stored.image.stored) return apiError(503, "Photo storage is not available right now. Try again later.");
  await audit({
    db: gated.ctx.db,
    userId: gated.ctx.auth.user.id,
    action: "MEDIA_UPLOADED",
    resourceType: "media",
    resourceId: stored.image.id,
    metadata: { category: "leadership" },
    ip: requestIp(request),
  });
  return jsonNoStore({ ok: true, url: stored.image.publicUrl }, { status: 201 });
}
