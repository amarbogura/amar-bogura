import type { SmsMessage, SmsProvider } from "./types";

/** Development provider: prints the SMS to the server log. Refuses to run in production. */
export class ConsoleSms implements SmsProvider {
  readonly name = "console";

  constructor(private readonly nodeEnv: string) {}

  async send({ to, text }: SmsMessage): Promise<void> {
    if (this.nodeEnv === "production") {
      throw new Error(
        "SMS_PROVIDER=console cannot deliver SMS in production. Configure a real SMS gateway.",
      );
    }
    console.warn(`[sms:console] → ${to}: ${text}`);
  }
}
