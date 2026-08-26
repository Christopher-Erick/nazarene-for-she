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

## Cloudflare (free tier) — automatic deploys

Every push to `master` (or `main`) runs GitHub Actions and deploys to **Cloudflare Workers** via OpenNext.

### One-time setup

1. Create a Cloudflare account (free plan is enough).
2. In Cloudflare → **My Profile** → **API Tokens** → create a token with **Edit Cloudflare Workers**.
3. Copy your **Account ID** from the Workers dashboard sidebar.
4. In GitHub → repo **Settings** → **Secrets and variables** → **Actions**, add:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
5. Optional: under **Variables**, set `NEXT_PUBLIC_SITE_URL` to your live URL (for example `https://nazarene-for-she.<subdomain>.workers.dev`).

After that, any push updates the live site automatically. You can also run the workflow manually from the **Actions** tab.

### Local deploy (optional)

```bash
npm run deploy
```

Requires Wrangler login (`npx wrangler login`) or the same env vars as above.

Do not put payment credentials or API keys in client code.

## Ethics

Stories, statistics, testimonials and account numbers are never fabricated. Photography on this site is atmospheric — fabric, classrooms, rooftops, kits — not images of people presented as beneficiaries.
