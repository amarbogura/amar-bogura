# 04 — Step-by-Step Development Plan (for Claude Code)

## How to run this plan
- Put `CLAUDE.md` at repo root and these docs in `docs/`. Claude Code loads `CLAUDE.md` automatically.
- **One phase per session.** Start with plan mode, approve the plan, let it implement, review, commit,
  then `/clear` before the next phase. Each phase has a ready-to-paste prompt.
- Resolve OPEN decisions in `docs/01` before the phase that depends on them (noted per phase).
- Branch per phase (`phase-03-auth`), PR to `main`, Vercel preview per PR.

Dependency order:
```
P0 Setup → P1 DB+Seed → P2 Auth → P3 UI shell/Home → P4 Catalog pages
        → P5 Uploads → P6 FORM ENGINE → P7 Requests → P8 Admin core
        → P9 Buy&Sell → P10 Property → P11 Search → P12 Admin catalog+form builder+CMS
        → P13 Notifications → P14 SEO/static pages → P15 Hardening/PWA/analytics → P16 QA & launch
```

---

## P0 — Project setup & foundations
**Tasks**
- Next.js App Router + TS strict, pnpm, ESLint + Prettier, path alias `@/`.
- Tailwind + shadcn/ui init; theme tokens for palette (green primary, navy, orange accent), radius, Bangla font via `next/font`.
- `src/env.ts` typed env validation (Zod) — DATABASE_URL, BETTER_AUTH_SECRET/URL, GOOGLE_CLIENT_ID/SECRET, TURNSTILE_SITE_KEY/SECRET, CLOUDINARY_*, RESEND_API_KEY, UPSTASH_*, SMS_PROVIDER, TELEGRAM_*, NEXT_PUBLIC_SITE_URL.
- Vitest + Testing Library, Playwright skeleton, GitHub Actions: typecheck, lint, test.
- Utilities: `formatTaka`, `toBanglaDigits`, `normalizeBdPhone`, `dhakaTime`, `cn`.
- Security headers in `next.config` (CSP baseline, HSTS, X-Frame-Options, Referrer-Policy).

**Done when** app boots, CI green, utilities have tests.

> **Prompt:** "Read CLAUDE.md and docs/01. Execute Phase P0 from docs/04-development-plan.md. Use plan mode first and list every file you'll create."

## P1 — Database schema, migrations & seed
**Tasks**
- Prisma + Neon (pooled URL for app, direct URL for migrations). Schema from `docs/02` (Better Auth models via its CLI, merged).
- Raw SQL migration for `pg_trgm` indexes.
- `src/lib/db.ts` singleton client.
- Seed script (idempotent upserts): Areas (Bogura district, 12 upazilas, main Sadar areas: Satmatha, Jaleshwaritola, Malotinagar, Sutrapur, Namazgarh, Kalitola, Thanthania, Sherpur Road, Banani, Chelopara, etc. — admin can edit later), 12 Categories, all Services, ListingCategories, **all form templates from docs/03** (as v1), SiteSettings (hotline, ambulance phone placeholders), Pages (placeholder Bangla text), HomeSections, a SUPER_ADMIN user from env.
- Seed-time check: slug uniqueness across Category(SERVICE)+Service; every form template passes the meta-schema (P6 builds the meta-schema — in P1 store templates, add the check in P6).

**Done when** `pnpm db:migrate && pnpm db:seed` works twice without duplicates; Prisma Studio shows the full catalog.

> **Prompt:** "Execute Phase P1. Use docs/02 schema and docs/03 section 6 seed mapping. Put template seed sources in src/features/forms/templates/*.ts as typed FormSchema objects (define the types from docs/03 §2 now)."

## P2 — Authentication & authorization  *(D-02, D-03 decided)*
**Tasks**
- Better Auth with Prisma adapter; plugins: `phoneNumber` (OTP) with `SmsProvider` interface (ConsoleSms for dev), **Google social provider**, `admin` (roles), `twoFactor` (admins), email+password (admins only).
- Pages: `/login` ("ফোন নম্বর দিয়ে লগইন" primary + "Google দিয়ে লগইন" secondary; phone → OTP → name on first login), `/admin/login` (email+password → TOTP).
- `/account/verify-phone`: Google users add + OTP-verify phone; required before first request/listing (`requireVerifiedPhone()`); linking Google to an existing phone account from profile. Unique verified phone per user; conflict → explain and offer login with that phone.
- `getSession()`, `requireUser()`, `requireAdmin(permission)`; permission map (D-09) in `src/lib/permissions.ts`.
- Proxy/middleware: redirect unauthenticated from `/account/*` and `/admin/*` (optimistic cookie check); authoritative checks in layouts and actions.
- Rate limits (Upstash): OTP send 3/10 min per phone + 10/hour per IP; verify 5 attempts; admin login 5/15 min.
- Guest-request linking: on phone verification (signup, login, or Google user adding phone), attach `ServiceRequest` where `userId IS NULL AND contactPhone = phone`.
- Profile page: name, phone (read-only), area.

**Done when** user OTP login, admin login with 2FA, role guard tests (user cannot reach any admin route or action).

> **Prompt:** "Execute Phase P2. Decisions D-02/D-03/D-04/D-09 in docs/01 are final as written [or: as I changed them]. Write tests proving a normal user gets 403 on admin server actions."

## P3 — UI shell, design system & homepage
**Tasks**
- Layout: sticky header (logo, search trigger, login/profile), **mobile bottom nav**, desktop top nav, footer (About, Contact, Help, Terms, Privacy, Report).
- Components: `CategoryCard`, `ServiceCard`, `ListingCard`, `SectionHeader`, `EmptyState`, `Breadcrumbs`, `PriceTag`, `StatusBadge`, `CallButton`, `WhatsAppButton`, skeletons.
- Homepage (Server Component, ISR, tag `home`): hero "বগুড়ায় কী সার্ভিস খুঁজছেন?" + search bar; 12-category grid (icons, 3 cols mobile / 6 desktop); Quick Actions (Custom Request, Emergency Ambulance in orange, Buy & Sell); Popular/Recently added services; Local Products & Grocery; ProTutors Bogura block; IT & Digital; recent listings; banners — all from `HomeSection`/`Banner`.
- Floating emergency call chip on mobile (configurable).

**Done when** Lighthouse mobile ≥ 90 performance/accessibility on homepage with seed data.

> **Prompt:** "Execute Phase P3. Invoke the frontend-design approach: modern, trustworthy Bangla local marketplace, not a generic shop. Mobile-first at 360px. No more than 12 category cards on home."

## P4 — Category & service pages (SEO-ready)
**Tasks**
- `/services/[slug]`: resolves Category (kind SERVICE) → sub-service grid + intro + FAQ; or Service → detail page (description, starting price, what's included, FAQ, related services, big "রিকোয়েস্ট করুন" CTA → `/services/[slug]/request`).
- `generateStaticParams` + ISR tags `category:{slug}` / `service:{slug}`; `generateMetadata` (title, description, canonical, OG).
- JSON-LD: `BreadcrumbList`, `Service` (areaServed Bogura), `FAQPage` (only if FAQs exist).
- Category-kind routing: MARKETPLACE → `/buy-sell`, PROPERTY → `/property`, CUSTOM_REQUEST → `/request/custom`.
- `/emergency/ambulance` dedicated page with Call-now above the fold.

**Done when** all seeded slugs render statically; unknown slug → 404; metadata verified in tests.

## P5 — Media uploads (Cloudinary)
**Tasks**
- Route handler `POST /api/uploads/sign` (auth or guest-with-rate-limit): returns signed params with folder by purpose, allowed formats jpg/png/webp/heic, max 5 MB, eager transformation to webp ≤1600px.
- Client `ImageUploader`: pick/camera, client-side compress (browser-image-compression), progress, reorder, remove; after upload call server action `registerMedia` → creates `MediaAsset(TEMP)` after verifying the resource via Cloudinary Admin API (type, size).
- Cron route (Vercel Cron, daily): delete TEMP assets older than 24h from Cloudinary + DB.

**Done when** upload works on mobile Chrome, invalid type/size rejected server-side, cron tested.

## P6 — ★ Dynamic form engine (core)
**Tasks** (spec: `docs/03` §2–3)
- `types.ts`, meta-schema `formSchemaSchema`, `visibility.ts`, `build-zod.ts` (client/server modes), `summarize.ts`.
- Field components for every `FieldType` (shadcn based, big touch targets, Bangla labels, inline errors): route, person, address/area picker (upazila → area combobox), item_list repeater, images (P5 uploader), datetime (Dhaka tz).
- `<DynamicForm>`: RHF + zodResolver built from schema; multi-step by section with progress; final step = common fields + review; sessionStorage draft; accessible error summary.
- `<DetailsView>` read-only renderer.
- **Tests (must):** visibility rules; hidden-required fields not enforced; stripping unknown/hidden keys; phone normalization; item_list min; cross-field rules; every seeded template passes meta-schema; snapshot of rendered field set per template.
- Dev-only page `/dev/forms` to preview every template (excluded from production build/robots).

**Done when** all templates from docs/03 render and validate on `/dev/forms`; tests green.

> **Prompt:** "Execute Phase P6 — the most important phase. Follow docs/03 exactly. Build the engine generically; no template-specific code in components except via schema. Write the tests listed before the UI."

## P7 — Request flows (service, custom, emergency) + My Requests
**Tasks**
- `/services/[slug]/request`: resolve template (service → category default → generic), render `<DynamicForm>` with service context (pinned variants). **No login gate** (D-03): guests fill name + phone; logged-in users get prefill; soft prompt "লগইন করলে রিকোয়েস্ট ট্র্যাক করা সহজ" (never blocking). Guest submit adds Cloudflare Turnstile + honeypot + `BlockedPhone` check.
- `/track`: guest enters request code + phone → OTP to that phone → read-only request view with user-visible timeline.
- Server action `submitServiceRequest` (flow in docs/03 §3.3): transaction, `code` generator `AB-YYMMDD-XXXX` (per-day sequence, retry on conflict), priority from template (`urgency=emergency` or `isEmergency`), `RequestEvent CREATED`, attachments.
- `/request/custom` (custom_request template, type CUSTOM).
- Success page: code, what happens next, hotline, WhatsApp link with prefilled code.
- `/account/requests` list (status badges, filter) and `/account/requests/[code]` (DetailsView + user-visible timeline + cancel while NEW/REVIEWING).
- Anti-spam: rate limit (5 requests/hour/user; guests 3/hour per IP and 5/day per phone), honeypot, Turnstile (guests only), duplicate detection (same phone+service within 10 min → return existing code). Emergency services get looser limits but still log IP hash.

**Done when** E2E: logged-in user submits AC repair; guest submits truck rental and ambulance; guest later logs in with same phone and sees both requests; `/track` works; cancel works.

## P8 — Admin core: dashboard, requests, users
**Tasks**
- `/admin` layout (sidebar desktop, drawer mobile), role-aware menu.
- Overview: counts (new requests today, pending listings, active services, users), emergency requests pinned at top, 7-day chart.
- Requests: table with filters (status, category, service, area, priority, date, assignee, guest/user, spam, search by code/phone), "Mark spam" + "Block phone" actions, saved "New" view; detail page with DetailsView, contact buttons, status change (validated by `canTransition`), user-visible message vs internal note, assign to self/other, quote amount, tags; timeline.
- Admin can create a request on behalf of a phone caller (`source=PHONE`).
- Users: list/search, view requests & listings, ban/unban, change role (SUPER_ADMIN only).
- AuditLog written by a `withAudit()` helper on every admin action; audit viewer (SUPER_ADMIN).
- CSV export of filtered requests (flatten details with labels).

**Done when** full request lifecycle NEW→COMPLETED done by admin, user sees updates, audit rows present.

## P9 — Buy & Sell marketplace
**Tasks**
- `/buy-sell` (sub-category tiles incl. Property tile → `/property?purpose=sale`, latest listings), `/buy-sell/[categorySlug]` (filters: price range, area, condition, template `filterable` fields; sort newest/price; cursor pagination), `/buy-sell/item/[code]` (gallery, attributes via DetailsView, seller contact reveal for logged-in users, report button, share, similar listings).
- `/account/listings` + `/account/listings/new?category=` : common listing fields + attribute template + photos (1–8); submit → PENDING. Edit rules per docs/02 §5. Mark sold, renew.
- Admin moderation queue: approve / edit / reject (reason required) / remove; bulk approve.
- Expiry cron: ACTIVE past `expiresAt` → EXPIRED.
- Filters on JSONB attributes: use Prisma JSON path filters; only for `filterable` fields.

## P10 — Property (rent & sale)
**Tasks**
- `/property` with clear **ভাড়া / বিক্রয়** tabs, type chips, filters: area, price/rent range, bedrooms, size, furnished, tenantPref.
- `/property/[categorySlug]` SEO pages (house-flat-rent, office-shop-rent, land-sale, house-sale, other-property-sale); `/property/item/[code]`.
- Posting uses the same listing flow with property templates + promoted columns (price per month for rent, size units for land).
- Admin: same moderation + property-specific columns in table.

## P11 — Search
**Tasks**
- `searchAll(q)` server function: normalize (trim, lower, Bangla digit → Latin), trigram similarity over services/categories (+keywords) and ACTIVE listings; ranked, grouped results.
- Header search: instant suggestions (debounced, Server Action or route handler, rate-limited); `/search?q=` results page grouped: সার্ভিস, Buy & Sell, Property; no-result state → CTA to Custom Request prefilled with the query.
- Log each search to `SearchLog`; admin report: top queries, zero-result queries.

## P12 — Admin catalog, form builder & CMS
**Tasks**
- Category / Service / ListingCategory CRUD: Bangla/English names, slug (auto from nameEn, uniqueness across namespace), icon picker, image, rank drag-sort, status, featured, emergency, allowGuest, keywords, SEO fields, intro markdown, FAQ editor, related services, form template select. All saves call `revalidateTag`.
- **Form builder (D-16):** template list; editor with field list (add/duplicate/reorder/delete), field inspector (type, key [locked after publish], labels, required, options, validation, showIf picker limited to earlier fields, width, summary/filterable), live `<DynamicForm>` preview (mobile frame), JSON view (read-only), publish → new version with changelog; "Clone template". Keys used by existing requests cannot be removed silently — show warning.
- CMS: banners, home sections (order + config), pages (markdown editor with preview), site settings (hotline, WhatsApp, ambulance number, notify emails).
- Reports & contact messages inbox with resolve/dismiss.

## P13 — Notifications
**Tasks**
- `notify` service with channels: email (Resend + React Email templates in Bangla), SMS (`SmsProvider`), Telegram (admin group bot). Fire-and-forget via `after()` so requests stay fast; failures logged.
- Events: request created (user SMS with code, admin email/Telegram; EMERGENCY → immediate Telegram with call link), status change with `visibleToUser` message (SMS on COMPLETED/REJECTED), listing approved/rejected (SMS), new listing pending (admin digest).
- Feature flags via env so channels can be off.

## P14 — Technical SEO & static pages
**Tasks**
- `app/sitemap.ts` (categories, services, listing categories, property pages, ACTIVE listings with lastmod), `app/robots.ts` (disallow /admin, /account, /api, /dev), canonical everywhere, OG image generation (`opengraph-image.tsx`) per category/service/listing.
- Internal linking: parent → sub-service → related; breadcrumbs everywhere.
- Pages from CMS: About, Contact (form → ContactMessage), Help/FAQ, Terms, Privacy, Report a problem.
- `hreflang` not needed (Bangla only); `lang="bn"` on html.

## P15 — Hardening, performance, PWA, analytics
**Tasks**
- Security review: every server action has Zod + auth (or guest path with Turnstile) + rate limit; no admin data in client bundles; CSP tightened (Cloudinary, analytics domains); upload checks; output escaping of user text; IDOR tests (user A cannot read user B's request by code).
- Performance: image sizes, `priority` only on LCP image, font subsetting, bundle analysis, Suspense streaming on lists, DB indexes checked with `EXPLAIN` on admin filters.
- PWA: manifest (name "আমার বগুড়া", theme color green, icons 192/512/maskable), installable; no service-worker caching beyond defaults.
- Analytics (D-15): Vercel Analytics + Speed Insights; custom events: search, request_start, request_submit, listing_submit, call_click, whatsapp_click.
- Error monitoring (Sentry optional) and structured server logs.

## P16 — QA & launch
**Tasks**
- Playwright E2E on mobile viewport: OTP login (mock SMS), Google login → forced phone verification (mocked OAuth), each template family submits once, custom request, guest ambulance, listing post → admin approve → public visible, property filter, search → custom request fallback, admin status update → user sees message.
- Content pass: Bangla copy review, real hotline numbers, intro text + FAQs per service.
- Production: Neon prod branch, migrations via CI, seed catalog (not demo data), Vercel env vars, domain + SSL, Search Console + sitemap submit, backups (Neon PITR) confirmed.
- Launch checklist from the brief, all items ticked; provider features confirmed absent.

---

## Phase → brief checklist traceability
| Brief checklist item | Phase |
|---|---|
| User Login / Admin Login | P2 |
| Parent category navigation / Sub-service pages | P3, P4 |
| Search | P11 |
| Custom Request | P7 |
| Buy & Sell | P9 |
| Property Rent/Sale | P10 |
| Admin management | P8, P12 |
| Mobile responsive | P3 onward |
| SEO metadata + sitemap | P4, P14 |
| Security basics | P2, P15 |
| Analytics | P15 |
| Provider features hidden | enforced by CLAUDE.md scope rules |
