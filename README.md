# AidoPost

Turn 2–3 phone photos of one product into social-media-ready, professionally staged post images, without changing the product itself. The product spec is in [`docs/mvp-spec.md`](docs/mvp-spec.md), and the original brief is in [`docs/original-brief.md`](docs/original-brief.md).

One TypeScript codebase serves:

- **Website**: `aidopost.com/{locale}`. It is the landing page (hero with before/after slider, how it works, filterable examples, bento benefits, pricing, FAQ). There are also pricing, login, password reset, terms and privacy pages.
- **Studio**: `/{locale}/studio`. The `app.` host redirects to it. It is a 4-step wizard (Brand → Product → Style → Photos) plus a history page, and it requires login.
- **API**: `/api/*`, a set of Next.js route handlers.
- **Worker**: `worker/index.ts`. It is a BullMQ consumer that runs the Claude and Gemini pipeline, plus the scheduled jobs.

## Quick start (local)

```bash
cp .env.example .env            # set AUTH_SECRET; AI_MOCK=true runs without API keys
npm install
npx prisma migrate dev          # needs Postgres (DATABASE_URL)
npm run db:seed                 # the 10 industries with translations
npm run dev                     # http://localhost:3000
npm run dev:worker              # only when REDIS_URL is set
```

- **Without `REDIS_URL`**, jobs run inside the web process, so you only need Postgres.
- **Without `RESEND_API_KEY`**, the verification and reset links are printed to the server console.
- **With `AI_MOCK=true`**, Claude and Gemini are replaced by deterministic fakes. The mock image composites your real photo onto a gradient. This lets the whole flow run in development and CI without keys. Never enable it in production.

Checks: `npm run typecheck && npm run lint && npm test && npm run build && npm run build:worker`

The ledger tests run against a real Postgres database when `DATABASE_URL` is set, including a check that concurrent requests can't spend the same credit twice.

### Sprint 0 AI spike

```bash
npm run pipeline:try -- --style premium --desc "Handmade silver rings from Yerevan" ring1.jpg ring2.jpg
```

This runs industry + product analysis in parallel, then the A/B/C prompts, then 3 Gemini images. The output goes to `pipeline-out/`, where you can rate the results (US-01).

## The AI pipeline (`src/lib/jobs.ts`, `src/lib/ai/*`)

| Step | When | Model |
|---|---|---|
| varA industry | Starts in the background as soon as a brand is approved. Saved brands reuse it. | `CLAUDE_FAST_MODEL` (Haiku 5.5), structured JSON (Zod) |
| varB product | Starts in the background once the 2nd photo lands. Re-runs when photos change, and stale results are discarded via `analysisVersion`. | Haiku 5.5 vision on photos resized to 1024 px |
| Prompts A/B/C | Written in one call on the first **Suggest photos**, then cached on the session. | `CLAUDE_PROMPT_MODEL` (Sonnet 5.5) |
| Image | One per click: variant A, then B, then C, with all reference photos. | `GEMINI_IMAGE_MODEL` |
| Fidelity check | Only when `FEATURE_FIDELITY_CHECK=true`. A failed check triggers one automatic retry with a stronger instruction, and the user is never charged twice. | Haiku 5.5 vision |

- **Preservation block**: the server validates that every prompt contains the exact preservation wording. If it is missing, Claude is asked again once, and then the server inserts the block itself (`src/lib/ai/preservation.ts`).
- **Credits**: one credit is reserved on click. It is committed when the image succeeds and refunded on any failure. Balance is the sum of the ledger, and buckets keep the monthly allowance (no rollover) separate from packs and the trial (`src/lib/credits.ts`).
- **Logging**: every AI call is logged to `ai_call_logs` with model, latency, tokens, cost and outcome. If one generation costs more than $0.06, a warning is logged.
- **Progress**: generation stages are streamed to the loading screen over SSE (`/api/sessions/:id/events`).

## Plans and downloads

Prices and limits live in `src/lib/plans.ts` and mirror the spec:

| Plan | Price | Images | Max download |
|---|---|---|---|
| Free | — | 5 total | 1024 px, watermarked |
| Lite | $9/month annual, $15/month monthly | 40 per month | 2048 px |
| Pro | $19/month annual, $39/month monthly | 160 per month | 4096 px |

- **One-off purchases**: a single clean HD image is $5, and a pack of 20 credits is $5.
- **Watermarking**: the clean original is always stored. The watermark is added only when an image is downloaded or previewed, so upgrading unlocks every past image.
- **Free users** see the Renderforest-style 3-card download modal. **Paid users** pick size and aspect ratio directly.

### Payments: Paddle (default) or Stripe

The app takes payments through **Paddle**, selected with `BILLING_PROVIDER=paddle`.

- Paddle is the Merchant of Record. It charges the customer, handles VAT and sales tax, and pays out to your own bank account.
- **How a payment runs:**
  1. The server creates a Paddle transaction (`/api/billing/checkout`).
  2. The browser opens Paddle's checkout overlay on top of the page (`src/lib/checkout-client.ts`).
  3. Paddle notifies `/api/webhooks/paddle`. That webhook activates plans, grants monthly credits, and records HD purchases and credit packs.
- Paddle webhook events to subscribe to: `transaction.completed`, `subscription.created`, `subscription.updated`, `subscription.activated`, `subscription.past_due` and `subscription.canceled`.
- **Payment links:** set Paddle's default payment link to `https://aidopost.com/en/pricing`. The site opens checkouts from `?_ptxn=` links in Paddle's emails.
- **Stripe** still works if you set `BILLING_PROVIDER=stripe`. Its webhook is `/api/webhooks/stripe`, with the events `checkout.session.completed`, `customer.subscription.*`, `invoice.paid` and `invoice.payment_failed`.

The full step-by-step setup, including connecting your bank account, is in the Railway setup guide.

## Deploying on Railway

Create one project with 4 services: **web**, **worker**, **Postgres** and **Redis**. Make two environments, staging (from `develop`) and production (from `main`).

| Service | Config file | Notes |
|---|---|---|
| web | `railway/web.json` (Dockerfile.web) | `prisma migrate deploy` runs as the pre-deploy step. Health check is `/api/health`. |
| worker | `railway/worker.json` (Dockerfile.worker) | `WORKER_CONCURRENCY` defaults to 8. Daily cleanup and grant crons are built in, using BullMQ job schedulers. |

Variables:

- `DATABASE_URL=${{Postgres.DATABASE_URL}}` and `REDIS_URL=${{Redis.REDIS_URL}}`
- The secrets listed in `.env.example`
- `STORAGE_DRIVER=azure` with `AZURE_STORAGE_CONNECTION_STRING` and `AZURE_STORAGE_CONTAINER` (Azure Blob Storage)

Add the custom domains `aidopost.com` and `app.aidopost.com` to the web service.

OAuth redirect URIs:

- `https://aidopost.com/api/auth/callback/google`
- `https://aidopost.com/api/auth/callback/microsoft-entra-id`

## Implementation notes and deviations from the spec

- **Single package instead of an apps/packages monorepo.** Web and worker share `src/lib` and deploy from the same repo as two Railway services, each with its own watch paths. Splitting it later is mechanical.
- **Uploads go through the API** instead of browser-to-bucket signed URLs. This lets the server validate, convert HEIC and normalise every photo before storing it. Downloads use 15-minute signed links: SAS URLs on Azure Blob Storage, presigned URLs on S3.
- **Pro "Ultra HD" (4096 px) is an on-demand lanczos upscale** of the standard generation. Re-generating at 4K would produce a different image and costs more than the plan price, as the cost note in the spec explains.
- **Trial abuse controls** include: one trial per normalised email and per OAuth account (kept even after the account is deleted), a sign-up rate limit per IP, and a disposable-domain blocklist. Device fingerprinting is not implemented yet.
- **"Try another style" after 3 photos** starts a new session that reuses the same photos and product analysis (open question #2 in the spec).
- **Brand-name search** needs `BRAVE_SEARCH_API_KEY`. Without it, the studio falls back to "Describe it". Social links use public metadata only.
- **Translations** for hy, ar, de, tr, sv and es were drafted by AI and **need native-speaker review** before launch. The same applies to the Terms and Privacy pages, which are drafts for legal review.
- **Marketing artwork is illustrated SVG** for now. The real gallery (10 industries × 3 styles) should be generated with our own pipeline (Sprint 5).
- **Gemini model IDs** (`GEMINI_IMAGE_MODEL*`) and prices must be confirmed on the official Gemini docs before launch.
- **Storage:** production uses Azure Blob Storage with a private container. `STORAGE_DRIVER` also accepts `s3` (any S3-compatible store) and `local` (development).
- **Sentry is not wired up yet.** `SENTRY_DSN` is reserved for it. PostHog loads only after cookie consent.
