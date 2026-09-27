// Pure resolution of HomeSection rows into render-ready data (unit-tested without a DB).
import type { CategoryCardData } from "@/components/category-card";
import type { ServiceCardData } from "@/components/service-card";

export const MAX_HOME_CATEGORIES = 12;

export type QuickAction = "custom-request" | "ambulance" | "buy-sell";
const QUICK_ACTIONS: readonly QuickAction[] = ["custom-request", "ambulance", "buy-sell"];

export interface SectionRow {
  key: string;
  type: string;
  titleBn: string;
  config: unknown;
}

export interface CategoryWithServices extends CategoryCardData {
  shortDescBn: string | null;
  services: ServiceCardData[];
}

export type HomeSection =
  | { kind: "QUICK_ACTIONS"; key: string; titleBn: string; actions: QuickAction[] }
  | { kind: "SERVICES"; key: string; titleBn: string; services: ServiceCardData[] }
  | { kind: "CATEGORY_SPOTLIGHT"; key: string; titleBn: string; category: CategoryWithServices }
  | { kind: "PROTUTORS"; key: string; titleBn: string; category: CategoryWithServices | null }
  | { kind: "LISTINGS"; key: string; titleBn: string; limit: number };

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

/** Slugs referenced by the sections, so the caller can load exactly those rows. */
export function referencedSlugs(rows: SectionRow[]): { services: string[]; categories: string[] } {
  const services = new Set<string>();
  const categories = new Set<string>();
  for (const row of rows) {
    const config = asRecord(row.config);
    for (const slug of asStringArray(config.serviceSlugs)) services.add(slug);
    if (typeof config.categorySlug === "string") categories.add(config.categorySlug);
  }
  return { services: [...services], categories: [...categories] };
}

/**
 * Turns rows into sections. Unknown types and sections whose content no longer exists are dropped
 * (an admin disabling a category must never break the homepage). Service order follows the config.
 */
export function resolveHomeSections(
  rows: SectionRow[],
  services: Map<string, ServiceCardData>,
  categories: Map<string, CategoryWithServices>,
): HomeSection[] {
  const sections: HomeSection[] = [];
  for (const row of rows) {
    const config = asRecord(row.config);
    const base = { key: row.key, titleBn: row.titleBn };
    switch (row.type) {
      case "QUICK_ACTIONS": {
        const actions = asStringArray(config.actions).filter((a): a is QuickAction =>
          (QUICK_ACTIONS as readonly string[]).includes(a),
        );
        if (actions.length) sections.push({ kind: "QUICK_ACTIONS", ...base, actions });
        break;
      }
      case "SERVICES": {
        const list = asStringArray(config.serviceSlugs)
          .map((slug) => services.get(slug))
          .filter((service): service is ServiceCardData => !!service);
        if (list.length) sections.push({ kind: "SERVICES", ...base, services: list });
        break;
      }
      case "CATEGORY_SPOTLIGHT": {
        const category =
          typeof config.categorySlug === "string" ? categories.get(config.categorySlug) : undefined;
        // The ProTutors block (D-18) is the education spotlight with its own branding.
        if (row.key === "protutors")
          sections.push({ kind: "PROTUTORS", ...base, category: category ?? null });
        else if (category?.services.length)
          sections.push({ kind: "CATEGORY_SPOTLIGHT", ...base, category });
        break;
      }
      case "LISTINGS": {
        const limit =
          typeof config.limit === "number" ? Math.min(Math.max(config.limit, 1), 24) : 8;
        sections.push({ kind: "LISTINGS", ...base, limit });
        break;
      }
    }
  }
  return sections;
}
