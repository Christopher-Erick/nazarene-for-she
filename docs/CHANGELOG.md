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
