# Nazarene for She

Premium public website for **Nazarene for She** — a Kenyan community initiative equipping adolescent girls and young women with dignity, knowledge, mentorship, faith and practical skills.

**She Empowered, Community Inspired.**

## Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS v4 design tokens
- Zod-validated Edge API routes
- Cloudflare Pages / Workers architecture (`wrangler.jsonc`, `open-next.config.ts`)

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What you still need to fill in

This first version **does not invent** official facts. Marked placeholders remain until the organisation confirms them:

- Mission and vision wording (`lib/data/about.ts`)
- M-Pesa, bank and M-Changa details (`lib/data/donation.ts`)
- Contact email, phone and social URLs (environment variables)
- Consented beneficiary stories (`lib/data/stories.ts`)
- Additional impact statistics (`lib/data/impact.ts`)
- Authentic photography in `public/images/` (current images are atmospheric editorial stills, not portraits of named girls)

The only verified impact figure on the site is **600+ girls currently supported**.

## Content models

Structured data lives in `lib/data/` so a CMS can replace it later without redesigning the interface: programs, stories, impact metrics, donation methods, partners and events.

## Forms

`/api/contact` and `/api/donation` run on the Edge runtime. They validate input, apply a simple rate limit, reject cross-origin posts, and send mail when `RESEND_API_KEY` + `CONTACT_INBOX` or `CONTACT_WEBHOOK_URL` is set.

## Cloudflare

1. Set `NEXT_PUBLIC_SITE_URL` to the production domain.
2. Install `@opennextjs/cloudflare` and Wrangler when you are ready to publish.
3. Build with OpenNext and deploy the worker defined in `wrangler.jsonc`.

Do not put payment credentials or API keys in client code.

## Ethics

Stories, statistics, testimonials and account numbers are never fabricated. Photography on this site is atmospheric — fabric, classrooms, rooftops, kits — not images of people presented as beneficiaries.
