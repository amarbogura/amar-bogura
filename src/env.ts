import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Typed environment. Every variable is read through `env`, never `process.env` directly.
 *
 * Integrations not used yet are `.optional()`; each phase makes its variables required when it
 * starts using them (P1 database, P2 auth + Upstash, P5 Cloudinary + cron, P7 Turnstile (required), P13 email/Telegram).
 */
export const serverSchema = {
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Neon Postgres: pooled URL for the app, direct URL for migrations.
  DATABASE_URL: z.url(),
  DATABASE_URL_UNPOOLED: z.url(),

  // Seed-only: the first SUPER_ADMIN (created once; password never reset by re-seeding).
  SEED_SUPER_ADMIN_EMAIL: z.email().optional(),
  SEED_SUPER_ADMIN_PASSWORD: z.string().min(12).optional(),
  SEED_SUPER_ADMIN_NAME: z.string().min(1).optional(),

  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  // Extra origins allowed to call /api/auth (comma-separated, e.g. a Vercel preview URL).
  BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  // Cloudflare Turnstile (guest request anti-spam). Dev uses Cloudflare's public test keys.
  TURNSTILE_SECRET_KEY: z.string().min(1),

  // Cloudinary (signed uploads)
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  // Vercel Cron sends "Authorization: Bearer <CRON_SECRET>".
  CRON_SECRET: z.string().min(32),

  // Resend (email)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Upstash Redis (rate limiting)
  UPSTASH_REDIS_REST_URL: z.url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  // SMS: `console` logs OTPs in development; real BD gateways are added in P2/P13.
  SMS_PROVIDER: z.enum(["console"]).default("console"),
  SMS_API_KEY: z.string().optional(),

  // Telegram admin notifications (optional channel)
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
};

export const clientSchema = {
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
  NEXT_PUBLIC_GA4_ID: z.string().optional(),
};

export const env = createEnv({
  server: serverSchema,
  client: clientSchema,
  experimental__runtimeEnv: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_GA4_ID: process.env.NEXT_PUBLIC_GA4_ID,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
