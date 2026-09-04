import { jsonNoStore, readJsonBody } from "@/lib/security";

export function requestIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    ""
  );
}

export function isSecureRequest(request: Request) {
  const url = new URL(request.url);
  return url.protocol === "https:" || process.env.NODE_ENV === "production";
}

export async function parseBody(request: Request, maxBytes = 80_000) {
  const parsed = await readJsonBody(request, maxBytes);
  if (!parsed.ok) {
    return {
      ok: false as const,
      response: jsonNoStore(
        { ok: false, message: parsed.error === "payload-too-large" ? "That request is too large." : "Invalid JSON." },
        { status: 400 },
      ),
    };
  }
  if (!parsed.data || typeof parsed.data !== "object" || Array.isArray(parsed.data)) {
    return { ok: false as const, response: jsonNoStore({ ok: false, message: "Invalid JSON." }, { status: 400 }) };
  }
  return { ok: true as const, data: parsed.data as Record<string, unknown> };
}
