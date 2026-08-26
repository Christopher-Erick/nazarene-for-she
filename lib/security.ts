const WINDOW_MS = 15 * 60 * 1000;
const MAX = 8;
const MAX_KEYS = 5_000;
const hits = new Map<string, { count: number; reset: number }>();

/**
 * Soft per-isolate limiter. On Cloudflare Workers, memory is not shared across
 * isolates — use Cloudflare Rate Limiting / WAF for durable protection.
 * This still reduces burst abuse within a single isolate.
 */
export function rateLimit(key: string) {
  pruneExpired();
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.reset < now) {
    if (hits.size >= MAX_KEYS) pruneOldest();
    hits.set(key, { count: 1, reset: now + WINDOW_MS });
    return { ok: true as const, remaining: MAX - 1, retryAt: now + WINDOW_MS };
  }
  if (current.count >= MAX) {
    return { ok: false as const, remaining: 0, retryAt: current.reset };
  }
  current.count += 1;
  return { ok: true as const, remaining: MAX - current.count, retryAt: current.reset };
}

function pruneExpired() {
  const now = Date.now();
  for (const [key, value] of hits) {
    if (value.reset < now) hits.delete(key);
  }
}

function pruneOldest() {
  const first = hits.keys().next().value;
  if (first) hits.delete(first);
}

export function clientKey(request: Request) {
  const forwarded =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    "unknown";
  return forwarded.split(",")[0]?.trim() || "unknown";
}

export function allowedHosts(): string[] {
  const hosts = new Set<string>();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      hosts.add(new URL(siteUrl).host);
    } catch {
      /* ignore invalid */
    }
  }
  hosts.add("localhost:3000");
  hosts.add("127.0.0.1:3000");
  return [...hosts];
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "same-site" && site !== "none") {
    return false;
  }

  try {
    const originHost = new URL(origin).host;
    const host = request.headers.get("host");
    if (host && originHost === host) return true;
    return allowedHosts().includes(originHost);
  } catch {
    return false;
  }
}

export function sanitizeHeaderValue(value: string, max = 160) {
  return value
    .replace(/[\r\n\0]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export async function readJsonBody(request: Request, maxBytes = 48_000) {
  const lengthHeader = request.headers.get("content-length");
  if (lengthHeader) {
    const length = Number(lengthHeader);
    if (Number.isFinite(length) && length > maxBytes) {
      return { ok: false as const, error: "payload-too-large" as const };
    }
  }

  const raw = await request.text();
  if (raw.length > maxBytes) {
    return { ok: false as const, error: "payload-too-large" as const };
  }

  try {
    return { ok: true as const, data: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false as const, error: "invalid-json" as const };
  }
}

export function jsonNoStore(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  return Response.json(body, { ...init, headers });
}

export function isSafeWebhookUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
      host.endsWith(".internal")
    ) {
      return false;
    }
    const allow = process.env.CONTACT_WEBHOOK_ALLOWED_HOSTS;
    if (allow) {
      const allowed = allow.split(",").map((part) => part.trim().toLowerCase()).filter(Boolean);
      if (!allowed.includes(host)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function escapeJsonForScript(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export function isHttpsPublicUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}
