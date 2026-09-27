export interface SmsMessage {
  /** E.164, e.g. +8801712345678 */
  to: string;
  text: string;
}

/** Pluggable SMS gateway (D-02). Console in development; a BD gateway is added before launch. */
export interface SmsProvider {
  readonly name: string;
  send(message: SmsMessage): Promise<void>;
}
