import "server-only";

import { env } from "@/env";
import { toBanglaDigits } from "@/lib/bangla";

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

export function otpMessage(code: string): string {
  return `আমার বগুড়া: আপনার কোড ${toBanglaDigits(code)}। ৫ মিনিটের মধ্যে ব্যবহার করুন। কাউকে এই কোড দেবেন না।`;
}
