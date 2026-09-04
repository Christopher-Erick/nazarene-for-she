import { requireAuth, requirePermission, requireSuperAdmin, apiError } from "@/lib/cms/guard";
import { getSetting, setSetting } from "@/lib/cms/settings";
import { jsonNoStore } from "@/lib/security";
import { parseBody, requestIp } from "@/lib/cms/http";
import { audit } from "@/lib/cms/audit";
import { hasPermission, isSuperAdmin } from "@/lib/cms/auth";
import { run } from "@/lib/cms/db";
import type { PermissionKey } from "@/lib/cms/permissions";

export const runtime = "nodejs";

const OPEN_KEYS = ["organization", "donations", "seo_defaults", "privacy_policy"] as const;
const SUPER_KEYS = ["maintenance", "privacy_settings"] as const;
const KEY_VIEW: Record<(typeof OPEN_KEYS)[number], PermissionKey> = {
  organization: "organization.view",
  donations: "donations.view",
  seo_defaults: "settings.view",
  privacy_policy: "privacy.view",
};

export async function GET(request: Request) {
  const gated = await requireAuth(request);
  if (!gated.ok) return gated.response;
  const data: Record<string, unknown> = {};
  for (const key of OPEN_KEYS) {
    if (hasPermission(gated.ctx.auth, KEY_VIEW[key])) {
      data[key] = await getSetting(key, {});
    }
  }
  if (isSuperAdmin(gated.ctx.auth)) {
    for (const key of SUPER_KEYS) data[key] = await getSetting(key, {});
  }
  return jsonNoStore({ ok: true, settings: data });
}

export async function PUT(request: Request) {
  const body = await parseBody(request);
  if (!body.ok) return body.response;
  const key = String(body.data.key ?? "");
  const value = body.data.value;

  if ((SUPER_KEYS as readonly string[]).includes(key)) {
    const gated = await requireSuperAdmin(request);
    if (!gated.ok) return gated.response;
    await setSetting(gated.ctx.db, key, value, gated.ctx.auth.user.id);
    if (key === "privacy_settings") {
      const days = Number((value as { auditRetentionDays?: number })?.auditRetentionDays ?? 365);
      if (Number.isFinite(days) && days >= 30) {
        await run(gated.ctx.db, "DELETE FROM audit_logs WHERE created_at < ?", Date.now() - days * 86400000);
      }
    }
    await audit({
      db: gated.ctx.db,
      userId: gated.ctx.auth.user.id,
      action: "SETTINGS_CHANGED",
      resourceType: "settings",
      resourceId: key,
      ip: requestIp(request),
    });
    return jsonNoStore({ ok: true });
  }

  if (!(OPEN_KEYS as readonly string[]).includes(key)) return apiError(400, "Unknown setting.");
  const perm =
    key === "organization"
      ? "organization.edit"
      : key === "donations"
        ? "donations.edit"
        : key === "privacy_policy"
          ? "privacy.edit"
          : "settings.edit";
  const gated = await requirePermission(request, perm);
  if (!gated.ok) return gated.response;
  await setSetting(gated.ctx.db, key, value, gated.ctx.auth.user.id);
  await audit({
    db: gated.ctx.db,
    userId: gated.ctx.auth.user.id,
    action: key === "donations" ? "DONATION_UPDATED" : "SETTINGS_CHANGED",
    resourceType: "settings",
    resourceId: key,
    ip: requestIp(request),
  });
  return jsonNoStore({ ok: true });
}
