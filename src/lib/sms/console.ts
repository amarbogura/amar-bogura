import { appendFile } from "node:fs/promises";

import type { SmsMessage, SmsProvider } from "./types";

/** Development-only file the e2e tests read OTPs from (gitignored). */
export const DEV_SMS_OUTBOX = ".sms-outbox.jsonl";

/**
 * Development provider: prints the SMS to the server log (and, when `outboxPath` is given, appends
 * it to a JSON-lines file for e2e tests). Refuses to run in production.
 */
export class ConsoleSms implements SmsProvider {
  readonly name = "console";

  constructor(
    private readonly nodeEnv: string,
    private readonly outboxPath?: string,
  ) {}

  async send({ to, text }: SmsMessage): Promise<void> {
    if (this.nodeEnv === "production") {
      throw new Error(
        "SMS_PROVIDER=console cannot deliver SMS in production. Configure a real SMS gateway.",
      );
    }
    console.warn(`[sms:console] → ${to}: ${text}`);
    if (this.outboxPath) {
      await appendFile(this.outboxPath, `${JSON.stringify({ to, text, at: Date.now() })}\n`);
    }
  }
}
