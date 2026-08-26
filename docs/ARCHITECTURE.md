# Architecture

## What this is

A public marketing / storytelling site for Nazarene for She (Kenya). Content is
compile-time TypeScript modules under `lib/data/`. There is no user auth and no
application database. Mutations are contact and donation-inquiry POSTs that
forward to email/webhook when configured.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS v4 tokens in `app/globals.css`
- Zod at API boundaries (`lib/validation/`)
- Cloudflare Workers via OpenNext (`wrangler.jsonc`, `@opennextjs/cloudflare`)

## Routes

| Path | Purpose |
|------|---------|
| `/` | Narrative home |
| `/about` | Why we exist |
| `/programs`, `/programs/[slug]` | How we empower |
| `/impact` | Verified + placeholder metrics |
| `/stories`, `/stories/[slug]` | Consent-gated story frames |
| `/get-involved` | Paths to walk with her |
| `/donate` | Cause picker + inquiry (not card checkout) |
| `/contact`, `/partnership` | Conversations |
| `/privacy`, `/terms` | Legal |

## Trust boundaries

- Browser → `POST /api/contact`, `POST /api/donation` only (same-origin, Zod, rate limit, body size).
- Server → Resend or HTTPS webhook (SSRF-guarded). Secrets never `NEXT_PUBLIC_*`.
- Static pages are public; no personal DB; no client-trusted identity.

## Design system

Tokens: plum `#5e2063`, gold accent, ivory, Fraunces (display) + Outfit (UI).
Shared primitives: `ButtonLink`, `BrandMark`, form field CSS, `Reveal` for scroll
motion. Do not introduce a second CSS or state library.

## Platform chrome

Preserve `public/__grok/`, PreviewHostBridge, branding injector, and any
prewired `src/lib/auth` / `src/lib/db` stubs if present — do not strip for demos.
