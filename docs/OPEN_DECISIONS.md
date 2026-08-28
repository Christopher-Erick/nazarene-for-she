# Open decisions

Product choices that cannot be fully inferred from code. Each has a
**recommended default already implemented** or clearly deferred.

| Decision | Recommendation (implemented unless noted) | Status |
|----------|---------------------------------------------|--------|
| Live payment rails | Keep placeholders until org supplies official M-Pesa/bank/M-Changa; inquiry form is the primary path | Implemented |
| Atelier / garment shop | Made-to-order requests only until workshop photos, prices and payment rails are confirmed; no card checkout | Implemented |
| Public contact email | `nazareneforshe@gmail.com` from the January 2021 constitution; phone still unpublished | Implemented |
| Mission / vision | Use constitution Article 2 wording (light grammar correction only) | Implemented |
| Photos / stories | Atmosphere images only until consented portraits and stories arrive | Waiting |
| Mail transport | Prefer Resend (`RESEND_API_KEY` + `CONTACT_INBOX`); webhook optional with host allowlist | Operator config |
| Analytics | Keep lightweight `trackEvent` stub; no third-party pixel until privacy review | Implemented |
| CMS | Stay on `lib/data/*` until content volume justifies Sanity/Contentful | Deferred |
| Global API rate limit | Soft in-process now; add Cloudflare WAF/Rate Limiting before campaign spikes | Documented in SCALE |
| Custom domain | Set `NEXT_PUBLIC_SITE_URL` + Cloudflare custom domain when ready | Operator |
| Default colour theme | Light chrome and cream bands; keep current plum look as explicit dark mode; photo heroes stay cinematic | Implemented |
