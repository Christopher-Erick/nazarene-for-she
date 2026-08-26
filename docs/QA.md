# QA

## Commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run dev   # smoke at http://localhost:3000
```

## Critical journeys

1. Home → Programs → a program detail → Donate / Get involved.
2. Stories index → story detail → related programme → Support CTA.
3. Contact form: empty/invalid → validation; double-submit → single request (button locks).
4. Donate: pick cause → inquiry form → without mail config expect 503 in production semantics (dev message when unset).
5. Mobile ~390×844: header menu open/Escape close, no horizontal overflow, 44px targets.
6. Keyboard: tab through header, forms; visible focus rings.

## Invariants

- No invented paybill / bank numbers on Donate.
- Only verified impact figure claimed as fact: 600+ girls supported.
- Story placeholders clearly marked; no fake testimonials.
- API responses never echo secret env names.
- Console clean on happy path (no hydration mismatch on home Reveal).

## Auth invariants

N/A — auth disabled. Do not add client-trusted `userId` gates.
