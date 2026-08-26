# Caching

## What is cached

| Asset / response | TTL / strategy | Invalidation | Notes |
|------------------|----------------|--------------|-------|
| `/_next/static/*` | `max-age=31536000, immutable` | Content-hash rename on build | Safe CDN cache |
| Static HTML pages | CDN / Cloudflare edge default for public GET | Redeploy | No user-specific HTML |
| Images (`next/image`) | Build + edge image cache | Redeploy / new path | Atmospheric assets under `public/images/` |

## What is never cached

| Response | Why |
|----------|-----|
| `POST /api/contact`, `POST /api/donation` | Mutations; `Cache-Control: no-store` via `jsonNoStore` + `_headers` |
| Error JSON from APIs | Same — no shared cache of form outcomes |

There is no authenticated/user-specific HTML. If auth is added later, those routes must use `private, no-store`.

## Application memo (not HTTP cache)

`lib/cache/single-flight.ts` provides per-isolate promise dedupe + short TTL for
expensive pure work. It must not store user PII or durable truth across Workers.

## Client data cache

This app does not use TanStack Query. Marketing pages are RSC/static. Do not wrap
fetch in a second ad-hoc cache for form POSTs.

## Proof notes

- Writes are POSTs that return `no-store`.
- Public GETs do not include session cookies or personalised fragments.
- Changing donation/contact env config requires a redeploy/restart; it is not
  edge-cached into the client bundle (server-only vars).
