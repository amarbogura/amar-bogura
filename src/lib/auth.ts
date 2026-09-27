import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins/admin";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { twoFactor } from "better-auth/plugins/two-factor";

import { db } from "@/lib/db";

/**
 * Better Auth server config. P1 only declares the plugin set so `auth generate` produces the
 * matching Prisma models; P2 wires the SMS provider, Google OAuth, roles/permissions and rate limits.
 * Re-running the generator must be merged by hand into prisma/schema.prisma (custom User fields).
 */
export const auth = betterAuth({
  appName: "আমার বগুড়া",
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  plugins: [
    phoneNumber({
      sendOTP: () => {
        throw new Error("SMS provider is configured in P2");
      },
    }),
    // Roles operator | admin | super_admin and their permissions are defined in P2 (D-09).
    admin({ defaultRole: "user" }),
    twoFactor({ issuer: "Amar Bogura" }),
  ],
});
