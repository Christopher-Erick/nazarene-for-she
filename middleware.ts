import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cloudflareEnv } from "@/lib/cms/cloudflare";
import { DEFAULT_MAINTENANCE, resolveMaintenance, type MaintenanceState } from "@/lib/cms/maintenance";

/**
 * Kept as `middleware.ts` on purpose: Next 16 renames it to `proxy.ts`, but proxy
 * always runs on the Node.js runtime, which OpenNext on Cloudflare only supports
 * experimentally. Revisit once @opennextjs/cloudflare supports it officially.
 */

const MAINTENANCE_TTL_MS = 15_000;
let stored: { value: MaintenanceState; until: number } | null = null;

/** Maintenance row from D1, held per isolate for a few seconds so pages do not pay a query each. */
async function storedMaintenance(): Promise<MaintenanceState> {
  if (stored && stored.until > Date.now()) return stored.value;
  let value = DEFAULT_MAINTENANCE;
  try {
    const env = await cloudflareEnv();
    const row = await env?.DB?.prepare("SELECT value FROM site_settings WHERE key = ?")
      .bind("maintenance")
      .first<{ value: string }>();
    if (row) value = { ...DEFAULT_MAINTENANCE, ...(JSON.parse(row.value) as Partial<MaintenanceState>) };
  } catch {
    // No database (or no table yet): the site stays open.
  }
  stored = { value, until: Date.now() + MAINTENANCE_TTL_MS };
  return value;
}

export async function middleware(request: NextRequest) {
  if (resolveMaintenance(await storedMaintenance()).enabled) {
    return NextResponse.rewrite(new URL("/maintenance", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Public pages only: admin, APIs, the maintenance page and static files never need the check.
  matcher: ["/((?!_next/|api/|admin|maintenance|images/|favicon.ico|robots.txt|sitemap.xml|opengraph-image).*)"],
};
