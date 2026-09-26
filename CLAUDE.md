# Amar Bogura — Claude Code Project Guide

Mobile-first local marketplace web app for Bogura, Bangladesh: service requests,
vehicle rental, delivery, Buy & Sell, property, education, digital services, custom requests.

Read these before any work, in order:
1. `docs/01-analysis-and-decisions.md` — scope, gaps found in the brief, decisions (D-xx)
2. `docs/02-data-model.md` — entities, relations, Prisma schema draft
3. `docs/03-dynamic-forms.md` — the form engine (core feature) + every form template
4. `docs/04-development-plan.md` — phased build plan; work ONE phase at a time

## Hard scope rules (MVP)
- Only two kinds of login: **User** (phone OTP or Google; verified phone required before posting) and **Admin** (email+password+2FA; roles OPERATOR, ADMIN, SUPER_ADMIN).
- Service/custom requests work **without login** (guest: name + phone). Listings require login.
- **NO provider login, registration, dashboard, profile, commission, matching, or payment.**
  Do not create provider tables, routes, or UI. Keep the model provider-ready (see data model doc).
- Homepage shows parent categories only (12), never 30+ service cards.
- No categories beyond those in `docs/03` seed list unless the user approves.

## Stack (do not substitute without asking)
Next.js App Router + TypeScript (strict) · Tailwind CSS + shadcn/ui · Better Auth ·
Prisma ORM + Neon PostgreSQL · Cloudinary (signed uploads) · Zod · React Hook Form ·
Resend (email) · Upstash Redis (rate limit) · Vercel · PWA manifest (no offline).
Check installed major versions before writing config (Next.js 16 renamed `middleware.ts`
to `proxy.ts`; Prisma 7 uses `prisma.config.ts` + generated client output path). Follow
what is actually installed, not memory.

## Conventions
- Language: UI copy in **Bangla** (বাংলা). Code, identifiers, commits, comments in English.
  Store `nameBn` + `nameEn` for catalog entities; `nameEn` powers slugs/search synonyms.
- Money: integer BDT (whole taka), displayed as `৳১,২০০` using `Intl.NumberFormat('bn-BD')`.
- Phone: store E.164 (`+8801XXXXXXXXX`); validate BD mobile `^(\+?880|0)1[3-9]\d{8}$`, normalize on input.
- Time zone: `Asia/Dhaka` for all display and date logic.
- Folder layout: feature-first under `src/features/<feature>/` (components, actions, queries,
  schemas). Shared UI in `src/components/`. Server-only code imports `server-only`.
- Mutations = Server Actions validated with Zod on the server (never trust client validation).
  Route handlers only for: Better Auth, Cloudinary signing, cron, sitemap/robots, OG images.
- Every admin action: server-side role check via `requireAdmin(permission)` + write `AuditLog`.
- Every public mutation: rate limited (Upstash) + Zod validated + sanitized (no raw HTML from users).
- Public pages are Server Components, statically rendered/ISR where possible; invalidate with
  `revalidateTag` from admin mutations.
- Accessibility: semantic HTML, labels on all inputs, 44px min touch targets, AA contrast.

## Commands
- `pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm typecheck` · `pnpm test` (Vitest) · `pnpm e2e` (Playwright)
- `pnpm db:migrate` · `pnpm db:seed` · `pnpm db:studio`
Run `pnpm typecheck && pnpm lint && pnpm test` before declaring a phase done.

## Working rules for Claude Code
- Start each phase in plan mode; list files you will create/change; then implement.
- Do not start the next phase unprompted. End each phase with a short summary + what to test manually.
- If a requirement is ambiguous or a decision in `docs/01` is marked OPEN, ask — don't guess.
- Never commit secrets. All env vars go through the typed env module (`src/env.ts`).
