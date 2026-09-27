"use client";

import { adminClient, phoneNumberClient, twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { ac, authRoles } from "@/lib/access-control";

export const authClient = createAuthClient({
  plugins: [
    phoneNumberClient(),
    // The admin login form handles `twoFactorRedirect` itself (TOTP step), so no global redirect.
    twoFactorClient(),
    adminClient({ ac, roles: authRoles }),
  ],
});

/** Better Auth returns English error codes; map the ones users can hit to Bangla. */
export function authErrorMessage(error: {
  code?: string;
  status?: number;
  message?: string;
}): string {
  if (error.status === 429) return "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।";
  switch (error.code) {
    case "INVALID_OTP":
      return "কোডটি সঠিক নয়। আবার চেষ্টা করুন।";
    case "OTP_EXPIRED":
    case "OTP_NOT_FOUND":
      return "কোডের মেয়াদ শেষ। নতুন কোড নিন।";
    case "TOO_MANY_ATTEMPTS":
    case "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE":
      return "অনেকবার ভুল কোড দেওয়া হয়েছে। নতুন কোড নিন।";
    case "ACCOUNT_TEMPORARILY_LOCKED":
      return "অনেকবার ভুল কোড দেওয়া হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।";
    case "INVALID_PHONE_NUMBER":
      return "সঠিক মোবাইল নম্বর দিন (যেমন ০১৭১২৩৪৫৬৭৮)।";
    case "PHONE_NUMBER_EXIST":
      return "এই নম্বরে আগে থেকেই একটি অ্যাকাউন্ট আছে।";
    case "INVALID_EMAIL_OR_PASSWORD":
      return "ইমেইল বা পাসওয়ার্ড সঠিক নয়।";
    case "INVALID_CODE":
    case "INVALID_BACKUP_CODE":
    case "INVALID_TWO_FACTOR_COOKIE":
      return "কোডটি সঠিক নয় বা মেয়াদ শেষ। আবার চেষ্টা করুন।";
    case "BANNED_USER":
      return "আপনার অ্যাকাউন্ট সাময়িকভাবে বন্ধ আছে।";
    // Our own server-side errors (src/lib/auth.ts) already carry Bangla messages.
    case "ADMIN_LOGIN_REQUIRED":
    case "ENDPOINT_DISABLED":
      return error.message ?? "এই কাজের অনুমতি আপনার নেই।";
    default:
      return error.status === 403
        ? "এই কাজের অনুমতি নেই। পেজটি রিফ্রেশ করে আবার চেষ্টা করুন।"
        : "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।";
  }
}
