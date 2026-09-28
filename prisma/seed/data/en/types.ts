import type { Faq } from "../types";

/**
 * English content for one seeded category / service / listing category, keyed by slug. Names
 * already live next to the Bangla (`nameEn`); these are the long texts (D-17, P7.5).
 */
export interface EnglishEntry {
  shortDesc?: string;
  /** Category introContent / Service description / ListingCategory introContent (markdown). */
  body?: string;
  priceNote?: string;
  seoTitle?: string;
  seoDescription?: string;
  faqs?: Faq[];
}

export type EnglishCatalog = Record<string, EnglishEntry>;
