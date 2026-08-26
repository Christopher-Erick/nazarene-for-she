/**
 * In-process single-flight memo for expensive pure computations.
 * Safe for serverless only as a per-isolate optimisation — never use for
 * cross-request durable state or user-specific data.
 */
const inflight = new Map<string, Promise<unknown>>();
const settled = new Map<string, { value: unknown; expires: number }>();
const MAX_ENTRIES = 64;

export async function singleFlight<T>(
  key: string,
  factory: () => Promise<T>,
  ttlMs = 60_000,
): Promise<T> {
  const now = Date.now();
  const cached = settled.get(key);
  if (cached && cached.expires > now) {
    return cached.value as T;
  }

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = factory()
    .then((value) => {
      if (settled.size >= MAX_ENTRIES) {
        const first = settled.keys().next().value;
        if (first) settled.delete(first);
      }
      settled.set(key, { value, expires: Date.now() + ttlMs });
      inflight.delete(key);
      return value;
    })
    .catch((error) => {
      inflight.delete(key);
      throw error;
    });

  inflight.set(key, promise);
  return promise;
}

export function clearSingleFlight(key?: string) {
  if (key) {
    inflight.delete(key);
    settled.delete(key);
    return;
  }
  inflight.clear();
  settled.clear();
}
