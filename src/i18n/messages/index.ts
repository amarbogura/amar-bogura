import type { Locale } from "../config";
import { bn } from "./bn";
import { en } from "./en";

export type Messages = typeof bn;

export const MESSAGES: Record<Locale, Messages> = { bn, en: en as unknown as Messages };
