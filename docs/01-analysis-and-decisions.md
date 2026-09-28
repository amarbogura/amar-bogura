# 01 — Analysis of the Brief & Decision Log

## 1. What the product really is

Reading the brief as an engineer, Amar Bogura is **not one marketplace but four different
interaction models** sharing one catalog, one user account system and one admin panel:

| Model | Parent categories | Who creates the record | Public? | Core entity |
|---|---|---|---|---|
| **A. Service request (lead)** | Home & Office, Rent a Vehicle, Courier, Bazar & Medicine, Wedding & Event, Education, Emergency, IT & Digital | User fills a service-specific form | No (user + admin only) | `ServiceRequest` |
| **B. Order-style request** | Local Products & Grocery (and bazar lists) | User submits an item list | No | `ServiceRequest` with item-list fields (see D-05) |
| **C. Classified listing** | Buy & Sell, Property | User (or admin) posts; admin approves | Yes, after approval | `Listing` |
| **D. Custom request** | Custom Request | User describes anything lawful | No | `ServiceRequest` (type CUSTOM) |

Because models A, B and D all end in "admin reviews → updates status → informs user", they share
**one request pipeline**. Model C is a separate publish/moderate pipeline. This is the most
important structural decision in the app.

The second most important decision: **each service needs different fields** (an AC repair needs
AC type and tonnage; a truck rental needs pickup/drop and load; a tutor request needs class and
subjects). Hardcoding 45+ forms is unmaintainable and blocks the admin from adding services. So we
build a **schema-driven form engine** (see `03-dynamic-forms.md`): forms are data (JSON templates,
versioned), rendered by one renderer, validated by one Zod builder on client and server.

## 2. Gaps and inconsistencies found in the brief

| # | Finding | Impact | Resolution |
|---|---|---|---|
| G1 | `Request` model has only "custom text" — no place for service-specific fields | Blocks core feature | JSONB `details` + versioned form templates (D-01) |
| G2 | Property appears twice: Buy & Sell → "Property/Land/House Sale" **and** Property → Land/House Sale | Duplicate data, confused users, split SEO | One `Listing` of kind PROPERTY; Buy & Sell "Property" tile links to `/property?purpose=sale` (D-06) |
| G3 | Custom Request is both a homepage category and a workflow | Modelling ambiguity | Category of kind `CUSTOM_REQUEST`, no sub-services; its page is the form (D-07) |
| G4 | Grocery/milk is inherently recurring and item-based; no cart/payment allowed in MVP | Form shape | Item-list + frequency fields in a request form (D-05, OPEN) |
| G5 | Emergency Ambulance behind a login wall is dangerous UX | Life-safety | Call button always visible; guest submission allowed for all requests (D-03) |
| G6 | Auth method unspecified; BD users mostly phone-first, email less used | Signup conversion, cost | D-02 (OPEN) |
| G7 | "Admin: id, role, permissions" — granularity unclear | Schema | Roles on user + permission map in code (D-09) |
| G8 | Location model is a free "area/location" string | No filtering, no future provider service areas | `Area` table seeded with Bogura upazilas/areas (D-08) |
| G9 | No listing lifecycle (expiry, sold, reports) | Stale marketplace | Status machine + 60-day expiry + report button (D-10) |
| G10 | Listing contact: phone public invites scraping/spam | Privacy | Phone revealed to logged-in users only (D-11) |
| G11 | How user gets "updated" is unspecified | Ops | In-app status timeline + notifications policy (D-12) |
| G12 | Search in Bangla + English + Banglish ("AC", "এসি", "ac service") | Search quality | `keywords[]` synonyms + Postgres `pg_trgm` (D-13); search stays language-agnostic on the bilingual site (D-17) |
| G13 | Route examples mix levels: `/services/home-office` (category) and `/services/electrician` (service) share one namespace | Slug collisions | Slug uniqueness enforced across Category+Service in `/services` (D-14) |
| G14 | "Analytics" in checklist, no tool named | — | D-15 |
| G15 | "Repeated custom requests → future categories" needs data | Product insight | `SearchLog` + custom request tagging in admin |
| G16 | Emergency medicine: prescription-only drugs | Legal | Prescription photo field; admin can reject (template note) |

## 3. Decision log

Status: **DECIDED** = safe default, build it. **OPEN** = needs product owner input; Claude Code
must build with the stated default *behind a clean seam* so it's cheap to change.

| ID | Decision | Default / choice | Status |
|---|---|---|---|
| D-01 | Service-specific fields | Versioned `FormTemplate` JSON; request stores `details` JSONB + `formVersionId`; common fields (contact, area, address, date) are real columns | DECIDED |
| D-02 | User login method | **Phone OTP + Google, both.** Better Auth `phoneNumber` plugin with a pluggable `SmsProvider` (console in dev, BD gateway in prod) + Google social provider. Account linking: a Google user must add and OTP-verify a phone before their first request/listing (phone is the operational identity); a phone user may link Google later from profile. One user = one verified phone (unique) | DECIDED |
| D-03 | Guest (no-login) requests | **All service & custom requests can be submitted as guest** (name + valid BD phone required). Listings (Buy & Sell, Property) still require login. Anti-spam for guests: rate limits (per IP + per phone), honeypot, Cloudflare Turnstile on guest submit, duplicate detection, admin "mark spam" + phone blocklist. Guest requests auto-link to the account when that phone is verified at signup/login. Guests track via `/track` (request code + OTP to the request phone) or by logging in with the same phone. `Service.allowGuest` stays as an admin kill-switch (default true) | DECIDED |
| D-04 | Admin login | Same Better Auth instance, role-based; separate `/admin/login` page; admin routes guarded at proxy (optimistic) + layout + every action (authoritative). Admins use email+password with **2FA (TOTP)** | DECIDED |
| D-05 | Grocery / local products | MVP: request form with item-list repeater + frequency (one-time/daily/weekly/monthly). No cart, no online payment, cash on delivery. `Product` catalog reserved for later | DECIDED |
| D-06 | Property duplication | Single PROPERTY listing kind with purpose RENT/SALE; Buy & Sell shows a "Property" tile that deep-links to Property section | DECIDED (confirm) |
| D-07 | Custom request | `ServiceRequest.type = CUSTOM`, `serviceId = null`, own form template `custom_request` | DECIDED |
| D-08 | Coverage | Whole Bogura district: 12 upazilas + key Sadar areas (admin-editable `Area` tree) | DECIDED (confirm) |
| D-09 | Admin permissions | Roles `OPERATOR` (requests + listings moderation), `ADMIN` (+ catalog, CMS, users), `SUPER_ADMIN` (+ admins, settings, audit). Permission map lives in code | DECIDED |
| D-10 | Listing lifecycle | DRAFT → PENDING → ACTIVE / REJECTED; ACTIVE → CLOSED (sold/rented) / EXPIRED (60 days, renewable) / REMOVED. Max 8 photos, 5 MB each | DECIDED |
| D-11 | Listing contact | Seller phone + WhatsApp button shown only to logged-in users; call is direct (no in-app chat in MVP) | DECIDED (confirm) |
| D-12 | Notifications | Admin: email (Resend) + optional Telegram bot on new request/listing. User: in-app status timeline; SMS on NEW (confirmation with request code) and COMPLETED/REJECTED if SMS gateway configured | DECIDED |
| D-13 | Search | Postgres `pg_trgm` over `nameBn`, `nameEn`, `keywords[]` for services/categories and title for listings; log every query to `SearchLog` | DECIDED |
| D-14 | URL design | `/services/[slug]` resolves category OR service (unique across both); `/buy-sell`, `/buy-sell/[categorySlug]`, `/buy-sell/item/[code]`; `/property`, `/property/[categorySlug]`, `/property/item/[code]`; `/request/custom`; `/emergency/ambulance` | DECIDED |
| D-15 | Analytics | Vercel Analytics + Speed Insights; GA4 optional via env var; server-side event log for funnel (request started/submitted) | DECIDED |
| D-16 | Form builder UI | Templates live in DB, **seeded from TypeScript files** in the repo. Admin gets a simple builder (add/reorder/edit fields, options, required, showIf) with live preview; publishing creates a new version | DECIDED (confirm) |
| D-17 | i18n | **Bilingual: Bangla (default) + English, switchable** (changed before P8; built in P7.5). URLs: Bangla at `/…`, English at `/en/…` (proxy rewrites `/…` → internal `[locale]` segment `bn`; `/bn/…` 308s to `/…`); hreflang + per-language canonical. Header/footer switcher opens the same page in the other language and remembers it in the `ab_locale` cookie. Own typed dictionaries (`src/i18n/messages/bn.ts` source of truth, `en.ts` type-checked), no i18n library. Long DB content has `…En` columns (empty → Bangla fallback); form template texts carry `{ bn, en }`. User-entered data is never translated. No browser-language auto-detect | DECIDED |
| D-18 | ProTutors Bogura | Built in-app as Education → Home Tutor service with the tutor form; branded section on homepage (links to `/services/home-tutor`) | DECIDED (P3) |
| D-19 | Service pricing display | Optional `startingPrice` + `priceNote` per service ("৳৫০০ থেকে শুরু, পরিদর্শনের পর চূড়ান্ত"). Admin can set `quotedAmount` on a request when updating the user | DECIDED |
| D-20 | Request IDs | Human-readable code `AB-YYMMDD-XXXX` shown to users for phone support; DB id stays cuid | DECIDED |

## 3a. Implementation notes (P2)
- **Admin sessions (D-04):** in better-auth 1.7 the twoFactor plugin only intercepts `/sign-in/email`; phone-OTP
  verification and OAuth callbacks create sessions without 2FA. A `databaseHooks.session.create.before`
  guard therefore refuses sessions for operator/admin/super_admin unless created by `/sign-in/email` or
  `/two-factor/verify-*`. The admin panel and admin actions additionally require `twoFactorEnabled`.
- **Account linking (D-02):** implicit linking is **off** (an OAuth login never attaches to an existing account
  by email). Phone users link Google explicitly from the profile while logged in; this needs
  `allowDifferentEmails` because phone accounts carry a placeholder email (`8801…@phone.amarbogura.invalid`).
- **Profile edits:** Better Auth's `/update-user` and `/change-email` are disabled (the phone-number plugin leaves
  `phoneNumber` writable there). Phones change only via OTP; name/area via the `updateProfile` action.
- **Admin Server Actions** are built with `adminAction(permission, schema, handler)` and live in
  `src/features/**/admin-actions.ts`; a guard test calls every one of them as a normal user and expects 403.
- **SMS:** the console provider refuses to send in production — a BD SMS gateway must be chosen before launch.

## 4. Non-functional targets
- Mobile-first at 360px width; bottom navigation on mobile (হোম, খুঁজুন, রিকোয়েস্ট, Buy & Sell, প্রোফাইল).
  "রিকোয়েস্ট" opens **my requests** (`/account/requests`) for logged-in users and `/track` for guests.
- LCP < 2.5s on 4G, CLS < 0.1; images via Cloudinary `f_auto,q_auto` + `next/image`.
- Bangla font: Hind Siliguri or Noto Sans Bengali via `next/font` (subset `bengali` + `latin`).
- Brand palette: deep green (primary), dark blue (headings/nav), warm orange (CTA/emergency accent), white.
- Security: OWASP basics, CSP headers, httpOnly secure cookies, rate limits on auth/submit/upload/search,
  file-type sniffing on uploads, audit log on admin writes.
