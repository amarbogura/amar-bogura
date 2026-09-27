import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins/admin";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { twoFactor } from "better-auth/plugins/two-factor";

import { env } from "@/env";
import { linkGuestRequests } from "@/features/auth/guest-linking";
import { ac, authRoles } from "@/lib/access-control";
import {
  canCreateSession,
  isBlockedAuthPath,
  rateLimitChecksFor,
  tempEmailForPhone,
} from "@/lib/auth-policy";
import { db } from "@/lib/db";
import { ADMIN_ROLES } from "@/lib/permissions";
import { isBdPhone, normalizeBdPhone } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import { getSmsProvider, otpMessage } from "@/lib/sms";

export const OTP_EXPIRES_IN_SECONDS = 300;

export const auth = betterAuth({
  appName: "আমার বগুড়া",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  // Development only: allow testing on a phone via the PC's LAN address (http://192.168.x.x:3000).
  trustedOrigins: env.NODE_ENV === "development" ? ["http://192.168.*", "http://10.*"] : [],
  database: prismaAdapter(db, { provider: "postgresql" }),

  // D-04: email + password is for admins only; nobody can self-register with it.
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 12 },

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      prompt: "select_account",
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      // Never auto-link an OAuth login to an existing account by email (e.g. an admin's).
      disableImplicitLinking: true,
      // Phone users have placeholder emails, so linking Google from the profile (while logged in)
      // necessarily links a different email.
      allowDifferentEmails: true,
      trustedProviders: ["google"],
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh daily
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (isBlockedAuthPath(ctx.path)) {
        throw new APIError("FORBIDDEN", {
          code: "ENDPOINT_DISABLED",
          message: "এই কাজটি এভাবে করা যাবে না।",
        });
      }
      const headers = ctx.request?.headers ?? ctx.headers;
      const ip = headers ? getClientIp(headers) : "unknown";
      for (const check of rateLimitChecksFor(ctx.path, ctx.body, ip)) {
        const { success, retryAfter } = await rateLimit(check.policy, check.key);
        if (!success) {
          throw new APIError(
            "TOO_MANY_REQUESTS",
            {
              code: "RATE_LIMITED",
              message: "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।",
            },
            { "Retry-After": String(retryAfter) },
          );
        }
      }
    }),
  },

  databaseHooks: {
    session: {
      create: {
        // D-04: admin-role users may only obtain sessions via email+password (+ TOTP).
        before: async (session, ctx) => {
          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { role: true },
          });
          if (!canCreateSession(user?.role, ctx?.path)) {
            throw new APIError("FORBIDDEN", {
              code: "ADMIN_LOGIN_REQUIRED",
              message: "অ্যাডমিন অ্যাকাউন্ট শুধু অ্যাডমিন লগইন পেজ থেকে ব্যবহার করা যাবে।",
            });
          }
        },
      },
    },
  },

  plugins: [
    phoneNumber({
      otpLength: 6,
      expiresIn: OTP_EXPIRES_IN_SECONDS,
      allowedAttempts: 5,
      // Clients must send normalized E.164; reject anything else so the same person can't
      // create a second account with a differently formatted number.
      phoneNumberValidator: (value) => isBdPhone(value) && normalizeBdPhone(value) === value,
      sendOTP: async ({ phoneNumber: to, code }) => {
        await getSmsProvider().send({ to, text: otpMessage(code) });
      },
      signUpOnVerification: {
        getTempEmail: tempEmailForPhone,
        getTempName: (value) => value,
      },
      callbackOnVerification: async ({ phoneNumber: verified, user }) => {
        await linkGuestRequests(user.id, verified);
      },
    }),
    admin({
      ac,
      roles: authRoles,
      defaultRole: "user",
      adminRoles: [...ADMIN_ROLES],
      bannedUserMessage:
        "আপনার অ্যাকাউন্ট সাময়িকভাবে বন্ধ আছে। সাহায্যের জন্য আমাদের সাথে যোগাযোগ করুন।",
    }),
    twoFactor({ issuer: "Amar Bogura" }),
    nextCookies(), // must be last: lets Server Actions set auth cookies
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
