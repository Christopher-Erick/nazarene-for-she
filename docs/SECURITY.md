# Security

Auth is intentionally off. There is no account system and no shared user database.
Destructive global mutations do not exist; forms only create outbound messages.

## Closed findings

| ID | Issue | How exploited | How prevented | Files |
|----|-------|---------------|---------------|-------|
| P1 | Cross-origin form POST | Attacker site POSTs JSON to `/api/*` | `Origin` + `Sec-Fetch-Site` same-origin check; 403 otherwise | `lib/security.ts`, API routes |
| P1 | False success when mail undelivered | User thinks message arrived; ops never see it | Fail closed with HTTP 503 when delivery not configured / fails; no secret names in body | `app/api/contact/route.ts`, `app/api/donation/route.ts` |
| P1 | JSON-LD XSS breakout | Crafted content closes `</script>` | `escapeJsonForScript` escapes `<>&` to Unicode | `lib/security.ts`, `components/seo/JsonLd.tsx`, story/program pages |
| P2 | Subject / header injection | CR/LF in name or intent | `sanitizeHeaderValue` strips control chars | `lib/security.ts` |
| P2 | Webhook SSRF | `CONTACT_WEBHOOK_URL` pointed at metadata IP | HTTPS-only + private-host block + optional host allowlist | `lib/security.ts` |
| P2 | Oversized body DoS | Huge JSON body | `readJsonBody` max ~48KB | `lib/security.ts` |
| P2 | Missing CSP / baseline headers | Clickjacking, MIME sniff, mixed content | CSP (+ grok.com allow), nosniff, frame deny, HSTS, Referrer-Policy, Permissions-Policy | `next.config.ts`, `public/_headers` |
| P2 | Social links as open redirect / XSS vectors | `javascript:` or http social URL in env | Footer only renders `https:` URLs | `SiteFooter`, `isHttpsPublicUrl` |
| P2 | Honeypot blocked by Zod before silent success | Bots got 422 instead of fake OK | Honeypot field optional/default `""`, max 200 | `lib/validation/*` |
| P2 | In-memory rate limit alone on Workers | Burst across isolates bypasses Map | Documented limitation; soft prune + CF WAF recommended; still applied per isolate | `lib/security.ts`, `docs/SCALE.md` |
| P3 | Double-submit form spam | Rapid clicks | Client lock + disabled controls after success; server rate limit | Form components, APIs |

## Explicit non-goals (current product)

- No session cookies, CSRF tokens, or logout — no auth surface.
- No file uploads.
- No user-controlled server-side fetch URLs from the client.
- Rate limit is best-effort per Worker isolate until Cloudflare Rate Limiting / KV is added.

## Operator checklist

1. Set `NEXT_PUBLIC_SITE_URL` to the live origin (used in allowlist + SEO).
2. Set either `RESEND_API_KEY` + `CONTACT_INBOX` or a safe `CONTACT_WEBHOOK_URL`.
3. Prefer `CONTACT_WEBHOOK_ALLOWED_HOSTS` when using a webhook.
4. Never commit `.env*` (see `.gitignore`); only `.env.example` is tracked.
5. Add Cloudflare WAF / rate limiting for `/api/*` in production.
