import { getMaintenance } from "@/lib/cms/settings";
import {
  publishedDonations,
  publishedEvents,
  publishedGarment,
  publishedGarments,
  publishedImpact,
  publishedPage,
  publishedPages,
  publishedPrivacy,
  publishedProgram,
  publishedPrograms,
  publishedStories,
} from "@/lib/cms/public-content";
import { jsonNoStore } from "@/lib/security";
import { publicContent } from "@/lib/cms/content";

export const runtime = "nodejs";

function publicHeaders(retryAfter?: number | null) {
  const headers = new Headers({ "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" });
  if (retryAfter) headers.set("Retry-After", String(retryAfter));
  return headers;
}

export async function GET(request: Request, context: RouteContext<"/api/v1/public/content/[type]">) {
  const maintenance = await getMaintenance();
  if (maintenance.enabled) {
    const retry = maintenance.estimatedReturnAt
      ? Math.max(30, Math.ceil((maintenance.estimatedReturnAt - Date.now()) / 1000))
      : 3600;
    return jsonNoStore(
      { ok: false, message: maintenance.message, maintenance: true },
      { status: 503, headers: publicHeaders(retry) },
    );
  }

  const { type } = await context.params;
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (type === "programs") {
    if (slug) {
      const item = await publishedProgram(slug);
      return item
        ? jsonNoStore({ ok: true, item }, { headers: publicHeaders() })
        : jsonNoStore({ ok: false, message: "Not found." }, { status: 404 });
    }
    return jsonNoStore({ ok: true, items: await publishedPrograms() }, { headers: publicHeaders() });
  }
  if (type === "events") {
    return jsonNoStore({ ok: true, items: await publishedEvents() }, { headers: publicHeaders() });
  }
  if (type === "stories") {
    return jsonNoStore({ ok: true, items: await publishedStories() }, { headers: publicHeaders() });
  }
  if (type === "atelier") {
    if (slug) {
      const item = await publishedGarment(slug);
      return item
        ? jsonNoStore({ ok: true, item }, { headers: publicHeaders() })
        : jsonNoStore({ ok: false, message: "Not found." }, { status: 404 });
    }
    return jsonNoStore({ ok: true, items: await publishedGarments() }, { headers: publicHeaders() });
  }
  if (type === "pages") {
    if (slug) {
      const item = await publishedPage(slug);
      return item
        ? jsonNoStore({ ok: true, item: publicContent(item) }, { headers: publicHeaders() })
        : jsonNoStore({ ok: false, message: "Not found." }, { status: 404 });
    }
    const items = await publishedPages();
    return jsonNoStore({ ok: true, items: items.map(publicContent) }, { headers: publicHeaders() });
  }
  if (type === "impact") {
    return jsonNoStore({ ok: true, items: await publishedImpact() }, { headers: publicHeaders() });
  }
  if (type === "donations") {
    return jsonNoStore({ ok: true, item: await publishedDonations() }, { headers: publicHeaders() });
  }
  if (type === "privacy") {
    return jsonNoStore({ ok: true, item: await publishedPrivacy() }, { headers: publicHeaders() });
  }

  return jsonNoStore({ ok: false, message: "Unknown public resource." }, { status: 404 });
}
