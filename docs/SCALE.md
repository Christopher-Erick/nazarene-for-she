# Scale & concurrency

## Current load shape

Most traffic is static page views. Mutations are rare contact/donation inquiries.

## Implemented

- Payload size cap and 10s delivery timeouts on outbound fetch.
- Per-IP soft rate limit (8 / 15 min / route family) with map prune and size cap.
- Client-side submit lock so double-click does not fire parallel requests.
- No durable in-memory Map for business data — content is static modules.
- Zod validation before any outbound send.

## Workers limitation (honest)

In-process `Map` rate limits and single-flight memos are **per isolate**. Under
Cloudflare, concurrent isolates do not share that memory. Treat them as burst
smoothing, not a global quota.

**Recommended production control:** Cloudflare Rate Limiting / WAF rules on
`/api/contact` and `/api/donation`, keyed by IP. Optional: Durable Object or KV
counter if product needs exact global quotas.

## Not applicable yet

- DB transactions / optimistic locking — no DB.
- Connection pooling — no DB.
- Idempotency keys persisted across instances — forms are inquiry notes, not
  payments; client lock + rate limit is the current control. When real payments
  land, use processor idempotency keys + durable store.

## Pagination / N+1

Program and story lists are tiny static arrays. Paginate if a CMS grows them past
~50 items.
