# Changelog

## Unreleased → ship (hardening pass)

- Security: same-origin enforcement, fail-closed delivery, JSON-LD escape, CSP,
  webhook SSRF guard, body limits, sanitized subjects, HTTPS-only social links.
- UX: form submit locks, inquiry-first donate when payment placeholders, story
  and program exit CTAs, related story↔program sync, mobile menu Escape.
- Consistency: removed unused BrandLockup/SectionLabel/ThreadPath/JourneyThread;
  footer uses `footerNav.work`.
- Scale/cache: documented Workers rate-limit limits; `singleFlight` helper;
  `no-store` on APIs; immutable static asset headers.
- Docs: ARCHITECTURE, SECURITY, CACHING, SCALE, QA, OPEN_DECISIONS.
- Tests: Node test runner coverage for security helpers, Zod forms, single-flight.

## Performance and repair pass

- Deploy: fixed the ESLint error in `ShopFloor` that stopped the GitHub deploy
  workflow at the Lint step; cleared the remaining lint warnings.
- Maintenance: the Super Admin maintenance switch (stored in D1) now actually
  takes public pages offline; `middleware.ts` reads it with a 15 s per-isolate
  cache. `CMS_MAINTENANCE=1` still works as an emergency override.
- Admin: the "not on your desk" page check no longer sticks after client-side
  navigation (it lived in a layout, which does not re-render).
- Speed: site footer and JSON-LD render on the server (less client JS); detail
  pages dedupe their D1 reads between metadata and page; Cloudflare Images
  binding (`IMAGES`) lets `next/image` serve resized AVIF/WebP; removed ~160
  unused CSS rules (globals.css about 30% smaller).
- Cleanup: removed Next.js starter SVGs and the unused `lib/rate-limit.ts` shim;
  full-size photo originals moved from `public/` to `assets/library-originals/`
  so they are no longer deployed.
