import "server-only";

import { env } from "@/env";
import type { Locale } from "@/i18n/config";
import { toLocaleDigits } from "@/i18n/format";
import { MESSAGES } from "@/i18n/messages";

import { ConsoleSms, DEV_SMS_OUTBOX } from "./console";
import type { SmsProvider } from "./types";

let provider: SmsProvider | undefined;

export function getSmsProvider(): SmsProvider {
  provider ??= createProvider(env.SMS_PROVIDER);
  return provider;
}

function createProvider(name: typeof env.SMS_PROVIDER): SmsProvider {
  switch (name) {
    case "console":
      return new ConsoleSms(
        env.NODE_ENV,
        env.NODE_ENV === "development" ? DEV_SMS_OUTBOX : undefined,
      );
  }
}

export function otpMessage(code: string, locale: Locale = "bn"): string {
  return MESSAGES[locale].sms.otp.replace("{code}", toLocaleDigits(code, locale));
}

/** Code to open one request on /track (sent in the request's language). */
export function trackOtpMessage(code: string, requestCode: string, locale: Locale): string {
  return MESSAGES[locale].sms.trackOtp
    .replace("{code}", toLocaleDigits(code, locale))
    .replace("{request}", requestCode);
}
