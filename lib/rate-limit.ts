const WINDOW_MS = 15 * 60 * 1000;
const MAX = 8;
const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string) {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.reset < now) {
    hits.set(key, { count: 1, reset: now + WINDOW_MS });
    return { ok: true, remaining: MAX - 1 };
  }
  if (current.count >= MAX) {
    return { ok: false, remaining: 0, retryAt: current.reset };
  }
  current.count += 1;
  return { ok: true, remaining: MAX - current.count };
}

export function clientKey(request: Request) {
  const forwarded = request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-forwarded-for")
    ?? "unknown";
  return forwarded.split(",")[0]?.trim() || "unknown";
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
