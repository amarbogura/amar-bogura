/**
 * Cache tags for `'use cache'` data (Cache Components). Admin mutations invalidate with
 * `revalidateTag(TAGS.x, "max")` (stale-while-revalidate) — see docs/04 P12.
 */
export const TAGS = {
  /** Homepage sections & their resolved content. */
  home: "home",
  /** Categories, services, listing categories. */
  catalog: "catalog",
  /** SiteSetting rows (hotline, WhatsApp, ambulance phone, emergency chip…). */
  settings: "settings",
  /** Form templates and their current versions (request forms). */
  forms: "forms",
  /** Upazilas and areas (area pickers). */
  areas: "areas",
  /** Public listings (P9/P10). */
  listings: "listings",
  /** One category page (`/services/[slug]`). */
  category: (slug: string) => `category:${slug}`,
  /** One service page (`/services/[slug]`). */
  service: (slug: string) => `service:${slug}`,
} as const;
