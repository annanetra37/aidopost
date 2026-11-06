# AidoPost --- MVP Product Specification

Nov 6, 2026 · \@annanetra

## 1. Product overview

AidoPost (aidopost.com) turns 2--3 phone photos of one product into a
social-media-ready, professionally staged post image in under a minute,
without changing the product itself.

The user describes their business, uploads 2--3 photos of the same
product, and picks a style (Minimalist, Casual, Premium). AidoPost
infers the industry, identifies the product, writes three distinct scene
prompts, and generates one image at a time with Gemini. Each input set
yields exactly 3 different images.

### MVP scope

  -----------------------------------------------------------------------
  In MVP                                Out of MVP (later)
  ------------------------------------- ---------------------------------
  Marketing website with \"Try the app  Native mobile apps
  for free\" CTA                        

  Web studio at app.aidopost.com, same  Direct publishing to
  design system                         Instagram/Facebook/TikTok

  Sign up / log in: email + password,   Team workspaces, shared brand
  Google, Microsoft                     kits

  7 UI languages incl. Arabic (RTL)     Caption and hashtag generation

  Brand profile: typed, or fetched from Video and carousel posts
  website/socials                       

  2--3 photo upload of one product +    Custom fonts, logo overlay, text
  style choice                          on image

  Claude analysis + 3 prompts, Gemini   Batch generation for whole
  generation, 3 variants                catalogs

  Free trial (5 images), Lite and Pro   Public API
  plans, Stripe billing                 

  Free: watermarked, medium-res         Affiliate program
  download; paid: clean, high-res       
  -----------------------------------------------------------------------

### Key decisions

-   **One generation = one image = one credit.** The free trial is 5
    credits; regenerating variant B or C costs a credit each.

-   **The product is sacred.** Every prompt instructs the image model to
    keep the product pixel-faithful and build only the scene around it.

-   **Analysis runs once per \"session\"** (description + photos +
    style). Prompts A, B, C are generated together and cached, so
    variants 2 and 3 start instantly.

-   **Brand content language follows the UI language** the user is
    working in, not the language of the fetched source.

### Open questions for Meghrik

-   [ ] Languages: the brief says 6 but lists 7 (English, Armenian,
    Arabic, German, Turkish, Swedish, Spanish). This spec assumes all 7.

-   [ ] After 3 variants, may the user change only the style and get 3
    more, or must they start a new session?

-   [ ] Instagram/Facebook fetching: Meta\'s terms forbid scraping. MVP
    proposal: fetch websites directly, and for social links use only
    public page metadata (title, bio, og:description); ask the user to
    confirm or edit.

-   [ ] Currency: prices in USD only, or local display (AMD, EUR, SEK,
    TRY, AED)?

-   [ ] Pricing copies Renderforest\'s structure and price points;
    confirm you want the same numbers or only the same model.

## 2. Users and journey

The core user is a small business owner who sells physical products on
Instagram and has no budget for a photographer.

  ------------------------------------------------------------------------
  Persona      Example                 Main need               Likely plan
  ------------ ----------------------- ----------------------- -----------
  Solo maker   Jewellery or ceramics   Premium look from phone Free → Lite
               brand in Yerevan        photos                  

  Small        Cosmetics shop in Dubai Many posts per week,    Pro
  retailer     or Istanbul             RTL/local language      

  Social media Manages 5--10 small     Fast output across      Pro
  freelancer   brands                  several brands          

  E-commerce   Etsy/Shopify seller in  Clean, consistent       Lite
  seller       Germany or Sweden       catalogue-style images  
  ------------------------------------------------------------------------

### End-to-end journey (happy path)

1.  Visitor lands on aidopost.com in their browser language and clicks
    **Try the app for free**.

2.  Sign-up modal: Google, Microsoft, or email + password. New users get
    5 free credits.

3.  Studio opens on the **Brand** step. The user either types a
    description, or pastes a brand name, website, or social link.

    a.  If a link or name is given, AidoPost fetches the brand info and
        shows a draft description in the current UI language.

    b.  The user edits and clicks **Approve**. Returning users pick a
        saved brand instead.

4.  **Product** step: upload 2--3 photos of the same product
    (drag-and-drop or phone camera).

5.  **Style** step: pick Minimalist, Casual, or Premium (visual cards
    with sample images).

6.  Click **Suggest photos**. A light, animated progress screen runs for
    about 15--30 seconds with tips and fun facts.

7.  Image 1 of 3 appears. The user can download it or click **Generate
    another (2 of 3)**.

8.  Download opens the plan-aware download modal (watermarked medium vs
    clean HD, see section 4).

9.  After image 3, the UI offers: new style, new product, or new brand.

10. When credits run out, the paywall shows Lite and Pro.

## 3. Marketing website (aidopost.com)

The website is a single scrolling landing page plus Pricing, Login,
Terms and Privacy, built in the same Next.js app as the studio so the
CTA opens the studio without a reload.

### Design direction (2026 trends)

-   **Hero:** large bold headline, an interactive before/after slider
    (phone photo → AidoPost result), and the primary CTA **Try the app
    for free --- 5 images, no card**.

-   **Look:** soft gradient mesh backgrounds, glassmorphism cards,
    bento-grid feature sections, oversized type, subtle scroll-triggered
    motion (Framer Motion), light and dark mode.

-   **Proof:** a horizontally scrolling gallery of results per industry
    and style; three-step \"How it works\" (Describe → Upload → Post).

-   **Performance:** Lighthouse ≥ 90 on mobile; images in AVIF/WebP;
    motion respects prefers-reduced-motion.

### Page sections

1.  Sticky header: logo, How it works, Examples, Pricing, language
    switcher, Log in, CTA button.

2.  Hero with before/after slider and CTA.

3.  How it works (3 steps).

4.  Examples gallery filterable by industry and style.

5.  Bento grid of benefits (product stays exact, 7 languages, 3 variants
    per product, ready-to-post sizes).

6.  Pricing (Free / Lite / Pro, monthly--annual toggle).

7.  FAQ.

8.  Final CTA band and footer (Terms, Privacy, contact, socials).

### Languages and localisation

  -------------------------------------------------------------------------
  Language   Code   Direction   Notes
  ---------- ------ ----------- -------------------------------------------
  English    en     LTR         Default fallback

  Armenian   hy     LTR         Armenian script font (e.g. Noto Sans
                                Armenian)

  Arabic     ar     RTL         Full mirrored layout, Arabic font (e.g.
                                Noto Kufi/IBM Plex Sans Arabic)

  German     de     LTR         Longer strings; test button widths

  Turkish    tr     LTR         Watch dotted/dotless i in uppercase

  Swedish    sv     LTR         

  Spanish    es     LTR         
  -------------------------------------------------------------------------

-   Locale in the URL (/hy, /ar ...) with hreflang tags; first visit
    detects Accept-Language, then the user\'s choice is stored in a
    cookie and their profile.

-   All UI strings in JSON message files (next-intl). Translations
    drafted by Claude, then reviewed by a native speaker before launch.

-   Use CSS logical properties (margin-inline-start) so RTL works
    without separate stylesheets.

-   The UI language also sets the language of fetched brand descriptions
    (section 5).

## 4. Accounts, plans and downloads

AidoPost mirrors Renderforest\'s model: a free tier with watermarked
lower-quality exports, Lite and Pro subscriptions at Renderforest\'s
current price points (annual discount up to \~51%), and a one-off \"pay
per download\" option.

### Sign up and login

-   Providers: Google (OAuth), Microsoft (Entra ID, personal + work
    accounts), email + password with email verification and password
    reset.

-   Auth via Auth.js (NextAuth) or Clerk; sessions in secure HTTP-only
    cookies.

-   The studio is gated: clicking the CTA while logged out opens the
    sign-up modal, then returns the user to the studio.

-   Abuse control on the free trial: one trial per verified email and
    per OAuth account; rate-limit sign-ups per IP and device
    fingerprint; block disposable email domains.

### Plans

Renderforest prices as captured on 2 Nov 2026: Lite \$9/month billed
annually or \$15 monthly; Pro \$19/month billed annually or \$39 monthly
([PricingSaaS](https://pricingsaas.com/companies/renderforest?history=2)).
Renderforest\'s own pricing page lists Nano Banana image allowances of
40 images on Lite, scaling up on Pro
([Renderforest](https://www.renderforest.com/ko/subscription)). AidoPost
copies these numbers.

  -----------------------------------------------------------------------
  Feature                   Free trial       Lite         Pro
  ------------------------- ---------------- ------------ ---------------
  Price (annual billing)    \$0              \$9 / month  \$19 / month
                                             (\$108/yr)   (\$228/yr)

  Price (monthly billing)   \$0              \$15 / month \$39 / month

  Image generations         5 total          40 / month   160 / month
                            (one-time)                    

  Download quality          Medium, 1024 px  HD, 2048 px  Ultra HD, 4096
                                                          px

  Watermark                 Yes (corner      No           No
                            ribbon)                       

  Saved brands              1                3            Unlimited

  Output formats (1:1, 4:5, 1:1 only         All          All
  9:16)                                                   

  Commercial licence        No               Yes          Yes

  Priority generation queue No               No           Yes

  Support                   Help centre      Email        Priority email
  -----------------------------------------------------------------------

-   Unused monthly generations do not roll over.

-   Credit top-up packs for paid users: 20 generations for \$5 (mirrors
    Renderforest\'s per-item add-ons).

-   Billing via Stripe Checkout + Customer Portal; Stripe Tax for EU
    VAT; webhooks update the plan in our database.

### Download strategy (Renderforest-style)

When a free user clicks **Download**, a modal shows three cards side by
side:

1.  **Free download** --- medium quality, AidoPost ribbon watermark. One
    click.

2.  **Buy this image in HD** --- \$5 one-off, clean, 2048 px, commercial
    use. Stripe Checkout, then instant download.

3.  **Subscribe** --- Lite or Pro, highlighted \"Best value\"; unlocks
    clean HD on every image, including ones already generated.

Paid users skip the modal and choose size and aspect ratio directly. The
original clean image is always stored server-side; the watermark is
applied at download time, so upgrading unlocks past images instantly.

## 5. Studio (app.aidopost.com)

The studio is a 3-step wizard (Brand → Product → Style) followed by a
results view; a progress rail at the top shows the step and the credits
left.

### Step 1 --- Brand

-   Two tabs: **Describe it** (free text, 30--1,000 characters) and
    **Find my brand** (one input accepting a brand name, website URL, or
    Instagram/Facebook/TikTok/LinkedIn link).

-   Returning users see their saved brands as cards first; picking one
    skips this step.

-   **Find my brand** flow:

    a.  Website URL → server fetches the page (title, meta description,
        og tags, About text, up to 3 pages, 10 s timeout).

    b.  Social link → server reads only public metadata (og:title,
        og:description, profile bio); no logged-in scraping.

    c.  Brand name only → web search API (e.g. Brave or Google
        Programmable Search), top 3 results.

    d.  Claude writes a 2--4 sentence brand description **in the current
        UI language**, whatever the source language.

    e.  The user sees the draft in an editable box and clicks
        **Approve** (or edits first). Nothing is saved until approved.

-   If fetching fails or finds little, show \"We couldn\'t find enough
    --- tell us in your own words\" and switch to **Describe it**.

### Step 2 --- Product photos

-   Upload 2--3 images (min 2, max 3), JPG/PNG/HEIC/WebP, ≤ 15 MB each,
    min 600 px short side. HEIC converted server-side.

-   On mobile, offer the camera directly; show tips: plain background,
    good light, different angles of **the same item**.

-   Light client-side check for blur/darkness with a gentle warning (not
    a block).

-   The server checks the photos show the same product during analysis
    (section 6); if not, the user is asked to re-upload.

### Step 3 --- Style

-   Three large visual cards: **Minimalist**, **Casual**, **Premium**,
    each with a sample image for the user\'s industry where available.

-   Aspect ratio picker (1:1 default; 4:5 and 9:16 for paid plans).

-   Button: **Suggest photos** (shows \"uses 1 credit\").

### Generation and results

-   **Loading screen:** light, airy animation (soft morphing gradient
    blob or Lottie of a camera flash), a thin progress bar driven by
    real backend stages (Analysing brand → Recognising product →
    Designing scene → Lighting → Final touches), and rotating tips
    (\"Posts with lifestyle scenes get more saves\").

-   **Result card:** image, label \"Photo 1 of 3\", buttons
    **Download**, **Generate another (2 of 3)**, and a short note:
    \"With these settings you can create 3 different photos.\"

-   **Generate another** uses the next cached prompt (B, then C) with
    the same photos; costs 1 credit each; no re-analysis, so it starts
    faster.

-   After photo 3: \"You\'ve used all 3 looks for this setup\" with
    buttons **Try another style**, **New product**, **New brand**.

-   **History:** a gallery page of all past sessions and images, with
    re-download.

-   **Out of credits:** blocking upgrade modal with Lite/Pro (and \"Buy
    20 credits\" for paid users).

### Saved brands and industries

-   Each user can save several brands; each brand stores its approved
    description and its assigned industry (varA).

-   A returning user picking a saved brand reuses its industry without a
    new classification call.

-   A new description creates a new brand record, so one user can hold
    several industries.

## 6. AI pipeline (the secret sauce)

The fastest design is to run the two Claude analyses early and in
parallel, in the background, while the user is still clicking through
the wizard; by the time they press **Suggest photos**, only the prompt
call and the first Gemini call remain.

![generation pipeline · 3 Claude calls, 3 Gemini
calls](media/image1.png){width="6.0in" height="4.098214129483814in"}

generation pipeline · 3 Claude calls, 3 Gemini calls

Prompts B and C are written in the same call as A and cached, so images
2 and 3 skip all analysis.

### Timing

-   **varA (industry)** starts the moment the brand description is
    approved (skipped for a saved brand).

-   **varB (product)** starts the moment the 2nd photo finishes
    uploading; re-runs if a 3rd is added.

-   **varC (style)** is the user\'s selection; no AI call.

-   On **Suggest photos**: wait for varA + varB (usually already done) →
    one Claude call writes prompts A, B, C together → Gemini generates
    image A. Prompts B and C are stored for the regenerate buttons.

-   Target: first image in under 30 s after click; images 2 and 3 in
    under 20 s each.

### Call 1 --- Industry (varA)

-   Model: Claude Haiku 5.5 (claude-haiku-5-5), fast and cheap;
    temperature 0; JSON output via tool use.

-   Input: approved brand description + the fixed list below.

-   Output: { \"industry_id\": \"beauty_cosmetics\", \"confidence\":
    0.91 }. Confidence below 0.5 → nearest match still assigned and
    logged for review.

  -----------------------------------------------------------------------------
  \#    industry_id             Industry           Typical products
  ----- ----------------------- ------------------ ----------------------------
  1     fashion_apparel         Fashion and        T-shirts, dresses, shoes
                                apparel            

  2     jewellery_accessories   Jewellery and      Rings, necklaces, watches,
                                accessories        bags

  3     beauty_cosmetics        Beauty and         Perfume, skincare, makeup
                                cosmetics          

  4     food_beverage           Food and beverage  Coffee, sweets, wine, sauces

  5     home_interior           Home and interior  Candles, ceramics, textiles,
                                                   furniture

  6     electronics_gadgets     Electronics and    Headphones, phone cases,
                                gadgets            chargers

  7     health_wellness         Health and         Supplements, yoga mats,
                                wellness           herbal teas

  8     arts_crafts_handmade    Arts, crafts and   Prints, handmade gifts,
                                handmade           stationery

  9     kids_toys               Kids and toys      Toys, baby clothes,
                                                   children\'s books

  10    sports_outdoors         Sports and         Bottles, gym wear, camping
                                outdoors           gear
  -----------------------------------------------------------------------------

The list lives in an industries table (with translations) so it can grow
without code changes.

### Call 2 --- Product (varB)

-   Model: Claude Haiku 5.5 with vision (switch to Sonnet 5.5 if
    accuracy is weak in testing).

-   Input: the 2--3 photos (resized to 1024 px long side to save
    tokens).

-   Output JSON: product_type (\"ring\"), product_name (\"gold signet
    ring with red enamel\"), materials, colours, key_details
    (engravings, logos, labels), same_product (true/false), photo_issues
    (blur, dark, cluttered background).

-   same_product = false → stop and ask the user to upload photos of one
    item. No credit is charged.

### Call 3 --- Prompts A, B, C

-   Model: Claude Sonnet 5.5 (claude-sonnet-5-5), one call returning all
    three prompts as JSON.

-   Input: varA, varB JSON, varC, brand description, aspect ratio.

-   Prompts are written in **English** (image models follow English
    best), whatever the UI language.

-   The three prompts must be clearly different scene concepts, e.g. A =
    studio/hero shot, B = lifestyle/in-use, C = creative/editorial
    flat-lay.

-   Every prompt must contain a preservation block. Required wording
    (system prompt enforces it, server validates it is present):

> Use the attached reference photos of the \[product_name\]. Keep the
> product EXACTLY as it appears: same shape, proportions, colours,
> materials, textures, logos, labels and text. Do not redraw, restyle,
> recolour, resize or add anything to the product. Only build the
> background, surface, props, lighting and composition around it. No
> added text, watermarks or people\'s faces unless asked.

### Style definitions (varC)

  -----------------------------------------------------------------------------
  Style        Background           Lighting       Props          Mood
  ------------ -------------------- -------------- -------------- -------------
  Minimalist   Solid or             Soft, even,    None or one    Clean, calm,
               soft-gradient,       diffused       simple shape   lots of space
               neutral tones                                      

  Casual       Real-life setting    Natural        Everyday items Warm,
               (table, café, home,  daylight       matching the   relatable,
               outdoors)                           industry       authentic

  Premium      Rich materials       Dramatic,      Few,           Elegant,
               (marble, velvet,     directional,   luxurious,     high-end,
               dark wood, stone)    glossy         curated        editorial
                                    highlights                    
  -----------------------------------------------------------------------------

### Image generation --- Gemini

-   Model ID kept in config (GEMINI_IMAGE_MODEL). Start with Gemini\'s
    Nano Banana family: a Flash image model for the free tier and
    standard generations, and Nano Banana Pro
    (gemini-3-pro-image-preview) for Pro-plan 4K output. Google is
    retiring and renaming these models through 2026--27, so confirm
    current IDs on the official Gemini API docs before build.

-   Request: the prompt + all 2--3 product photos as reference images,
    aspect ratio, output size.

-   Store the clean original in object storage; create a watermarked
    medium copy for free users.

-   **Cost check (important):** reported prices are about \$0.039 per
    Flash image and \$0.134 per Pro image. At 160 images, a Pro
    subscriber would cost \~\$6 on Flash but \~\$21 on Pro-image at 4K,
    above the \$19 plan price. Default to Flash and generate 4K only on
    download for Pro users.

### Fidelity check (MVP, behind a feature flag)

-   After generation, a Claude Haiku vision call compares the result
    with the reference photos and returns product_preserved: true/false.

-   If false, retry once automatically with a stronger preservation
    instruction; the user is not charged twice. Log both results for
    prompt tuning.

### Failure handling

-   Credits are reserved at click and only deducted on success; any
    failure refunds the credit.

-   Retries with exponential backoff on 429/5xx (max 2); clear user
    message if the image model refuses (e.g. safety block).

-   All AI calls log model, latency, tokens, cost and outcome per
    generation.

## 7. Architecture, data model and API

One TypeScript codebase (Next.js) serves the website, the studio and the
API, deployed entirely on Railway; long AI jobs run in a separate
Railway worker service so the web app never waits on a request for 30
seconds.

### Tech stack

  ------------------------------------------------------------------------
  Layer             Choice                          Why
  ----------------- ------------------------------- ----------------------
  Frontend +        Next.js (App Router), React,    SEO for the landing
  website           Tailwind CSS, Framer Motion,    page, RTL and i18n
                    next-intl                       built in

  Auth              Auth.js (Google, Microsoft      Fast social login
                    Entra ID, email) or Clerk       

  Database          PostgreSQL on Railway + Prisma  Relational data, easy
                                                    migrations

  Object storage    Cloudflare R2 or AWS S3 + CDN   Cheap image storage,
                                                    signed URLs

  Job queue         Redis on Railway + BullMQ       Parallel AI calls,
                                                    retries, progress
                                                    events

  Realtime progress Server-Sent Events from job     Drives the loading bar
                    status                          

  AI                Anthropic API (Claude Haiku     Analysis/prompts;
                    5.5, Sonnet 5.5); Google Gemini image generation
                    API (image)                     

  Image processing  sharp (resize, HEIC→JPG,        Fast, server-side
                    watermark)                      

  Payments          Stripe (Checkout, Billing,      Subscriptions +
                    Customer Portal, Tax)           one-off HD purchase

  Hosting           Railway: one project with web,  Everything in one
                    worker, Postgres and Redis      place, deploys from
                    services                        GitHub (see section 9)

  Monitoring        Sentry, PostHog (product        Errors and funnel
                    analytics), uptime check        
  ------------------------------------------------------------------------

### Data model (main tables)

  -----------------------------------------------------------------------
  Table               Key fields
  ------------------- ---------------------------------------------------
  users               id, email, name, auth_provider, ui_language, plan,
                      created_at

  subscriptions       user_id, stripe_customer_id,
                      stripe_subscription_id, plan (lite/pro),
                      billing_period, status, current_period_end

  credit_ledger       id, user_id, delta (+5 trial, +40 monthly, −1 per
                      image, refunds), reason, generation_id, created_at

  industries          id (slug), name_translations (json), sort_order

  brands              id, user_id, name, source_type
                      (typed/website/social/name), source_url,
                      description, description_language, industry_id,
                      industry_confidence, approved_at

  sessions            id, user_id, brand_id, style
                      (minimalist/casual/premium), aspect_ratio,
                      product_analysis (json = varB), prompts (json
                      A/B/C), status, created_at

  session_photos      id, session_id, storage_key, width, height, order

  generations         id, session_id, variant (A/B/C), model, status,
                      storage_key_clean, storage_key_watermarked,
                      fidelity_ok, latency_ms, cost_usd, error

  purchases           id, user_id, generation_id, stripe_payment_intent,
                      amount, status

  ai_call_logs        id, generation_id/session_id, call_type, model,
                      tokens_in, tokens_out, latency_ms, cost_usd,
                      success
  -----------------------------------------------------------------------

Credit balance = sum of credit_ledger.delta for the user (no separate
counter to drift).

### API endpoints

  ------------------------------------------------------------------------------------
  Method   Path                                  Purpose
  -------- ------------------------------------- -------------------------------------
  POST     /api/brands/fetch                     Fetch a brand from name/URL/social
                                                 link; returns a draft description in
                                                 the UI language

  POST     /api/brands                           Save an approved brand; triggers
                                                 industry classification (varA)

  GET      /api/brands                           List the user\'s saved brands

  POST     /api/sessions                         Create a session (brand, style,
                                                 aspect ratio)

  POST     /api/sessions/:id/photos              Get signed upload URLs; on upload
                                                 complete, triggers product analysis
                                                 (varB)

  POST     /api/sessions/:id/generate            Reserve a credit; generate prompts if
                                                 needed, then the next variant (A, B
                                                 or C)

  GET      /api/sessions/:id/events              SSE stream of progress stages and
                                                 results

  GET      /api/generations/:id/download?size=   Returns a signed URL: watermarked for
                                                 free, clean for paid or purchased

  POST     /api/billing/checkout                 Stripe Checkout for Lite/Pro
                                                 (monthly/annual) or one-off HD image

  POST     /api/billing/portal                   Stripe Customer Portal link

  POST     /api/webhooks/stripe                  Plan changes, renewals (add monthly
                                                 credits), payments

  GET      /api/me                               Profile, plan, credit balance,
                                                 language
  ------------------------------------------------------------------------------------

### Security and privacy basics

-   Uploaded photos stored privately; only signed URLs that expire after
    15 minutes.

-   API keys for Anthropic, Google and Stripe only on the server; never
    shipped to the browser.

-   Per-user rate limits on generate (e.g. 10 per minute) and on brand
    fetch (e.g. 20 per hour).

## 8. Sprints, user stories and tasks

The MVP fits into 6 two-week sprints (about 12 weeks) for one full-stack
engineer plus a part-time designer; the AI core comes first so quality
can be tuned while the rest is built.

  -------------------------------------------------------------------------
  Sprint   Goal                     Demo at the end
  -------- ------------------------ ---------------------------------------
  S0       Foundations and AI spike Script turns 3 photos + text into 3
                                    images with the product intact

  S1       Auth, i18n, studio       Log in with Google/Microsoft in any of
           skeleton                 7 languages, see the empty studio

  S2       Brand step + uploads     Fetch or type a brand, approve it,
                                    upload 2--3 photos

  S3       Generation flow end to   Click Suggest photos, watch progress,
           end                      get images 1--3

  S4       Credits, plans,          Free trial limits, watermark, Stripe
           downloads                subscribe, HD purchase

  S5       Website, polish, launch  Live aidopost.com with all languages,
                                    analytics, QA done
  -------------------------------------------------------------------------

### Sprint 0 --- Foundations and AI spike

  -------------------------------------------------------------------------
  ID      User story                            Acceptance criteria
  ------- ------------------------------------- ---------------------------
  US-01   As the product owner, I want proof    10 test products × 3
          that the product stays unchanged in   styles; ≥ 80% of images
          generated images, so we know the idea judged \"product
          works.                                unchanged\" by Meghrik

  US-02   As an engineer, I want a working repo Repo, CI, staging +
          and environments, so we can ship      production, env secrets set
          safely.                               
  -------------------------------------------------------------------------

-   [ ] Set up Next.js monorepo, TypeScript, ESLint, Prettier, CI
    (GitHub Actions)

-   [ ] Create the Railway project (web, worker, Postgres, Redis;
    staging + production environments), R2/S3 bucket, Sentry

-   [ ] Get Anthropic and Gemini API keys; confirm current Gemini image
    model IDs and prices

-   [ ] Write Claude calls 1--3 as standalone functions with JSON
    schemas

-   [ ] Write the Gemini call with 2--3 reference images; compare Flash
    vs Pro model on 10 products

-   [ ] Build a small internal test page to run the pipeline and rate
    results

-   [ ] Tune the preservation block and the 3 style definitions

### Sprint 1 --- Auth, i18n and studio skeleton

  ------------------------------------------------------------------------
  ID      User story                        Acceptance criteria
  ------- --------------------------------- ------------------------------
  US-03   As a visitor, I want to sign up   All 3 work; email
          with Google, Microsoft or email,  verification; returns to
          so I can start quickly.           studio after login

  US-04   As a user, I want the app in my   7 locales switchable; Arabic
          language, so I understand         fully RTL; choice remembered
          everything.                       

  US-05   As a new user, I want 5 free      Ledger gets +5 on first
          images, so I can try before       verified sign-up only; balance
          paying.                           shown in header
  ------------------------------------------------------------------------

-   [ ] Auth.js with Google, Microsoft Entra ID, email/password +
    verification and reset

-   [ ] Prisma schema and migrations for all tables in section 7

-   [ ] next-intl setup, locale routing, language switcher, RTL with
    logical CSS

-   [ ] Credit ledger service (grant, reserve, commit, refund) with unit
    tests

-   [ ] Studio shell: progress rail, credits badge, user menu

-   [ ] Trial abuse checks: disposable-email blocklist, IP sign-up rate
    limit

### Sprint 2 --- Brand step and uploads

  ------------------------------------------------------------------------
  ID      User story                         Acceptance criteria
  ------- ---------------------------------- -----------------------------
  US-06   As a user, I want to type what my  30--1,000 chars; saved on
          business does, so the app          Approve
          understands my brand.              

  US-07   As a user, I want to paste my      Draft description appears in
          website or Instagram link, so I    ≤ 10 s, in the current UI
          don\'t have to write.              language, editable before
                                             Approve

  US-08   As a returning user, I want to     Saved brands listed; industry
          pick a saved brand, so I skip this reused, no new classification
          step.                              

  US-09   As a user, I want to upload 2--3   Min 2, max 3; type/size
          photos of my product, so the app   checks; HEIC works;
          can stage it.                      thumbnails with remove

  US-10   As a user, I want to be told if my same_product=false → friendly
          photos show different products.    message, no credit used
  ------------------------------------------------------------------------

-   [ ] Brand fetch service: URL fetch + parse, social og-metadata,
    search API for names, 10 s timeout

-   [ ] Claude description writer (output in UI language)

-   [ ] Brand save endpoint; enqueue industry job (varA); seed 10
    industries with translations

-   [ ] Signed upload URLs, upload component (drag-drop, mobile camera),
    sharp conversion

-   [ ] Enqueue product analysis job (varB) when photo 2 lands; store
    JSON on session

-   [ ] Saved brands list UI

### Sprint 3 --- Generation flow end to end

  ------------------------------------------------------------------------
  ID      User story                          Acceptance criteria
  ------- ----------------------------------- ----------------------------
  US-11   As a user, I want to choose         3 visual cards; aspect ratio
          Minimalist, Casual or Premium, so   picker (free: 1:1 only)
          the photo matches my brand.         

  US-12   As a user, I want a pleasant        Stages update live via SSE;
          loading screen, so the wait feels   tips rotate; works in RTL
          short.                              

  US-13   As a user, I want my first photo    Image 1 from prompt A in ≤
          after clicking Suggest photos.      30 s (p75); product
                                              unchanged

  US-14   As a user, I want to generate a 2nd Button shows \"2 of 3\" /
          and 3rd different photo with the    \"3 of 3\"; uses prompts B
          same inputs.                        and C; 1 credit each; no
                                              re-analysis

  US-15   As a user, I want to see all my     History page lists sessions
          past images, so I can download them and images
          later.                              
  ------------------------------------------------------------------------

-   [ ] Style step UI + aspect ratio

-   [ ] Generate endpoint: reserve credit → wait for varA/varB → prompts
    call (once per session) → Gemini variant job

-   [ ] Validate each prompt contains the preservation block; reject and
    retry if missing

-   [ ] Store clean image; create watermarked medium copy

-   [ ] Fidelity check job behind feature flag; auto-retry once

-   [ ] SSE progress stream and loading screen animation

-   [ ] Results card, \"Generate another\" logic, end-of-3 options

-   [ ] Refund credit on any failure; AI call logging with cost

### Sprint 4 --- Credits, plans and downloads

  ------------------------------------------------------------------------
  ID      User story                          Acceptance criteria
  ------- ----------------------------------- ----------------------------
  US-16   As a free user, I want to download  Medium 1024 px with ribbon
          my image for free, even with a      
          watermark.                          

  US-17   As a free user, I want to buy one   \$5 Stripe Checkout; clean
          clean HD image without subscribing. 2048 px unlocked for that
                                              image

  US-18   As a user, I want to subscribe to   Stripe Checkout; plan active
          Lite or Pro, monthly or yearly.     after webhook; 40/160
                                              credits granted per period

  US-19   As a paid user, I want clean HD     No modal; size and ratio
          downloads of all my images,         choice; watermark gone
          including old ones.                 everywhere

  US-20   As a user who ran out of credits, I Paywall modal with plans;
          want clear options to continue.     top-up pack for paid users
  ------------------------------------------------------------------------

-   [ ] Stripe products/prices: Lite and Pro (monthly, annual), HD image
    \$5, 20-credit pack \$5

-   [ ] Checkout, Customer Portal, webhook handler (subscribe, renew,
    cancel, payment failed)

-   [ ] Monthly credit grant on renewal; no rollover

-   [ ] Download endpoint with plan-aware size and watermark;
    Renderforest-style 3-card modal

-   [ ] Paywall modal and Pricing page in the app

-   [ ] Stripe Tax for EU VAT; invoices emailed

### Sprint 5 --- Website, polish and launch

  -------------------------------------------------------------------------
  ID      User story                           Acceptance criteria
  ------- ------------------------------------ ----------------------------
  US-21   As a visitor, I want a modern        All sections in section 3;
          landing page that shows results, so  Lighthouse mobile ≥ 90
          I trust the product.                 

  US-22   As a visitor, I want to find the     hreflang, localised meta
          site in my language on Google.       tags, sitemap

  US-23   As the owner, I want to see the      PostHog events: visit →
          funnel, so I can improve conversion. signup → 1st image →
                                               download → paid
  -------------------------------------------------------------------------

-   [ ] Landing page build: hero before/after slider, gallery, bento
    grid, pricing, FAQ, footer

-   [ ] Create gallery images with our own pipeline (10 industries × 3
    styles)

-   [ ] Native-speaker review of all 7 translations

-   [ ] Terms of Service, Privacy Policy, cookie banner (EU)

-   [ ] Analytics events, Sentry alerts, uptime monitor

-   [ ] Full QA pass: devices, browsers, RTL, payments in Stripe test
    mode, load test of the queue

-   [ ] Production launch checklist (section 9)

## 9. Deployment on Railway, quality and launch

The whole product runs in one Railway project with two environments
(staging, production), each holding four services built from the same
GitHub repo.

### Railway services

  -------------------------------------------------------------------------------
  Service    What it runs                     Start            Public?
  ---------- -------------------------------- ---------------- ------------------
  web        Next.js website + studio + API   node server.js,  Yes: aidopost.com,
             (output: \"standalone\")         listens on       app.aidopost.com
                                              Railway\'s PORT  

  worker     BullMQ worker: Claude + Gemini   node             No
             jobs, watermarking, fidelity     dist/worker.js   
             check                                             

  Postgres   Railway PostgreSQL plugin        managed          No (private
                                                               network)

  Redis      Railway Redis plugin (queue +    managed          No (private
             rate limits + SSE progress)                       network)
  -------------------------------------------------------------------------------

-   **Repo layout:** one repo with apps/web and apps/worker (shared
    packages/db, packages/ai); each Railway service points at its own
    root directory and watch paths, so a worker change does not redeploy
    the web.

-   **Builds:** a Dockerfile per service (predictable, same image
    locally and on Railway); Node 20 LTS; sharp included.

-   **Config as code:** a railway.json per service with build/start
    commands, health check path /api/health, and restart policy.

-   **Migrations:** prisma migrate deploy runs as the web service\'s
    pre-deploy command, so the schema updates before new code serves
    traffic.

-   **Variables:** database and Redis URLs referenced from the plugins
    (\${{Postgres.DATABASE_URL}}, \${{Redis.REDIS_URL}}); services talk
    over Railway\'s private network. Secrets set per environment:
    ANTHROPIC_API_KEY, GEMINI_API_KEY, GEMINI_IMAGE_MODEL,
    STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, OAuth client IDs/secrets,
    R2\_\*, NEXTAUTH_SECRET, APP_URL.

-   **Images:** stored in Cloudflare R2 or S3 (not Railway volumes), so
    web and worker scale independently and images survive redeploys.

-   **Scheduled jobs:** a small Railway cron service for daily cleanup
    of abandoned uploads and a credit-grant safety check.

-   **Environments:** main branch → production, develop → staging; PR
    preview environments optional. Stripe test keys on staging, live
    keys on production.

-   **Domains and DNS:** custom domains added in Railway with CNAME
    records; SSL is automatic. Put Cloudflare in front for CDN caching
    of static assets and images.

-   **Scaling:** start with 1 web + 1 worker replica; add worker
    replicas when queue wait time exceeds 10 s. Long-lived SSE
    connections are fine on Railway.

-   **Backups:** enable Postgres backups and test one restore before
    launch.

### Non-functional requirements

  -----------------------------------------------------------------------
  Area                   Target
  ---------------------- ------------------------------------------------
  Time to first image    ≤ 30 s p75 after Suggest photos

  Images 2 and 3         ≤ 20 s p75 each

  Product fidelity       ≥ 90% of images pass the fidelity check after
                         tuning

  Uptime                 99.5% monthly

  Landing page           Lighthouse mobile ≥ 90; LCP \< 2.5 s

  Browsers               Last 2 versions of Chrome, Safari, Firefox,
                         Edge; iOS Safari, Android Chrome

  Accessibility          WCAG 2.1 AA on website and studio

  Cost per image         Tracked per generation; alert if average \>
                         \$0.06
  -----------------------------------------------------------------------

### Risks

  ------------------------------------------------------------------------
  Risk                 Impact                Mitigation
  -------------------- --------------------- -----------------------------
  Image model alters   Core promise broken   Preservation block, 2--3
  the product (logo,                         references, fidelity check +
  shape, colour)                             auto-retry, prompt tuning in
                                             S0

  Gemini model         Outage or margin loss Model ID in config;
  renamed, retired or                        abstraction layer allows a
  repriced                                   second provider

  Pro plan             Losses on heavy users Generate at standard size,
  unprofitable at                            upscale only on download;
  high-res generation                        monitor cost per user

  Instagram/Facebook   Brand fetch fails     Use only public metadata;
  block fetching                             fall back to typed
                                             description

  Free-trial abuse     API cost leak         One trial per verified
                                             identity, rate limits,
                                             disposable-email block

  Weak translation     Lost trust in key     Native-speaker review before
  quality (Armenian,   markets               launch
  Arabic)                                    

  Users upload         Legal complaints      Terms of Service: user
  others\' product                           confirms rights to uploads;
  photos or brands                           takedown contact
  ------------------------------------------------------------------------

### Compliance

-   GDPR: privacy policy, cookie consent, data processing agreements
    with Anthropic, Google, Stripe, Railway and the storage provider;
    account deletion removes photos and images within 30 days.

-   Terms state that generated images are AI-made, ownership/licence
    rules per plan, and acceptable-use rules.

-   EU VAT through Stripe Tax; Triple i or the AidoPost entity named as
    seller (to confirm).

### Launch checklist

-   [ ] Production Railway environment live, domains and SSL working,
    health checks green

-   [ ] Postgres backup restored successfully on staging

-   [ ] Stripe live mode: products, prices, webhook endpoint verified

-   [ ] Google and Microsoft OAuth apps verified for production domains

-   [ ] All 7 languages reviewed by native speakers; Arabic RTL checked
    on mobile

-   [ ] Gallery images generated for 10 industries × 3 styles

-   [ ] Sentry alerts, uptime monitor and PostHog funnel working

-   [ ] Load test: 50 parallel generations without queue failures

-   [ ] Terms, Privacy Policy and cookie banner published

### Sources

-   [Renderforest pricing (PricingSaaS, captured 2 Nov
    2026)](https://pricingsaas.com/companies/renderforest?history=2)

-   [Renderforest subscription
    page](https://www.renderforest.com/ko/subscription)

-   Gemini image model prices are third-party reports; confirm on
    Google\'s official Gemini API pricing page before build.
