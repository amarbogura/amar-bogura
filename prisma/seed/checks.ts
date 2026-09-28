// Pure seed-time validation (no DB). Runs before any write and in CI via checks.test.ts.
import { validatePresets, validateTemplate } from "@/features/forms/meta-schema";
import type { FormTemplateSeed } from "@/features/forms/types";

import type { homeSections as HomeSections } from "./data/cms";
import type { EnglishCatalog } from "./data/en/types";
import type { AreaSeed, CategorySeed } from "./data/types";

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

/** Returns a list of human-readable problems; empty means the seed data is consistent. */
export function validateSeedData(input: {
  categories: CategorySeed[];
  templates: readonly FormTemplateSeed[];
  areas: AreaSeed[];
  homeSections: typeof HomeSections;
  /** P7.5: English content keyed by slug (optional so older callers keep working). */
  english?: EnglishCatalog;
}): string[] {
  const { categories, templates, areas, homeSections, english } = input;
  const errors: string[] = [];
  const templateByKey = new Map(templates.map((t) => [t.key, t]));
  const services = categories.flatMap((c) => c.services ?? []);
  const listingCategories = categories.flatMap((c) => c.listingCategories ?? []);

  // Category + Service slugs share the /services/[slug] namespace (D-14).
  for (const slug of duplicates([
    ...categories.map((c) => c.slug),
    ...services.map((s) => s.slug),
  ])) {
    errors.push(`Slug "${slug}" is used more than once across categories and services`);
  }
  for (const slug of duplicates(listingCategories.map((l) => l.slug))) {
    errors.push(`Listing category slug "${slug}" is duplicated`);
  }

  for (const category of categories) {
    if (category.defaultTemplate) {
      const template = templateByKey.get(category.defaultTemplate);
      if (!template)
        errors.push(`Category ${category.slug}: unknown template "${category.defaultTemplate}"`);
      else if (template.kind !== "REQUEST")
        errors.push(`Category ${category.slug}: default template must be a REQUEST form`);
    }
    if (category.kind === "SERVICE" && !category.services?.length)
      errors.push(`SERVICE category ${category.slug} has no services`);
    if (category.kind !== "SERVICE" && category.services?.length)
      errors.push(`Only SERVICE categories may have services (${category.slug})`);
    if (!["MARKETPLACE", "PROPERTY"].includes(category.kind) && category.listingCategories?.length)
      errors.push(
        `Only MARKETPLACE/PROPERTY categories may have listing categories (${category.slug})`,
      );
  }

  const serviceSlugs = new Set(services.map((s) => s.slug));
  for (const service of services) {
    const template = templateByKey.get(service.template);
    if (!template) {
      errors.push(`Service ${service.slug}: unknown template "${service.template}"`);
      continue;
    }
    if (template.kind !== "REQUEST")
      errors.push(`Service ${service.slug}: template must be REQUEST`);
    if (service.faqs.length < 3) errors.push(`Service ${service.slug}: needs at least 3 FAQs`);
    if (service.keywords.length < 3)
      errors.push(`Service ${service.slug}: needs at least 3 keywords`);
    for (const related of service.related ?? []) {
      if (!serviceSlugs.has(related))
        errors.push(`Service ${service.slug}: unknown related "${related}"`);
      if (related === service.slug) errors.push(`Service ${service.slug}: related to itself`);
    }

    // P6: presets are checked by the form engine itself (field exists, value valid for its type).
    for (const issue of validatePresets(template.schema, service.formPresets ?? {})) {
      errors.push(`Service ${service.slug}: formPresets ${issue.path}: ${issue.message}`);
    }
  }

  // P6: every template must pass the form-engine meta-schema (docs/03 §2).
  for (const template of templates) {
    for (const issue of validateTemplate(template.schema)) {
      errors.push(`Template ${template.key}: ${issue.path} — ${issue.message}`);
    }
  }

  for (const listingCategory of listingCategories) {
    const template = templateByKey.get(listingCategory.template);
    if (!template) errors.push(`Listing category ${listingCategory.slug}: unknown template`);
    else if (template.kind !== "LISTING")
      errors.push(`Listing category ${listingCategory.slug}: template must be LISTING`);
  }
  for (const category of categories.filter((c) => c.kind === "PROPERTY")) {
    for (const listingCategory of category.listingCategories ?? []) {
      if (!listingCategory.propertyPurpose || !listingCategory.propertyTypes?.length)
        errors.push(`Property category ${listingCategory.slug}: needs purpose and property types`);
    }
  }

  const areaSlugs = new Set<string>();
  for (const area of areas) {
    if (areaSlugs.has(area.slug)) errors.push(`Area slug "${area.slug}" is duplicated`);
    if (area.parentSlug && !areaSlugs.has(area.parentSlug))
      errors.push(`Area ${area.slug}: parent "${area.parentSlug}" must be listed before it`);
    areaSlugs.add(area.slug);
  }

  const categorySlugs = new Set(categories.map((c) => c.slug));
  for (const section of homeSections) {
    const { serviceSlugs, categorySlug } = section.config as {
      serviceSlugs?: string[];
      categorySlug?: string;
    };
    for (const slug of serviceSlugs ?? []) {
      if (!services.some((s) => s.slug === slug))
        errors.push(`Home section ${section.key}: unknown service "${slug}"`);
    }
    if (categorySlug && !categorySlugs.has(categorySlug))
      errors.push(`Home section ${section.key}: unknown category "${categorySlug}"`);
  }

  // P7.5 (D-17): every seeded entity has English content, with as many FAQs as the Bangla.
  if (english) {
    const check = (
      kind: string,
      slug: string,
      bnFaqs: number,
      needs: Array<"shortDesc" | "body">,
    ) => {
      const entry = english[slug];
      if (!entry) return errors.push(`${kind} ${slug}: missing English content`);
      for (const field of needs) {
        if (!entry[field]?.trim()) errors.push(`${kind} ${slug}: English ${field} is empty`);
      }
      if ((entry.faqs?.length ?? 0) !== bnFaqs)
        errors.push(`${kind} ${slug}: ${entry.faqs?.length ?? 0} English FAQs, ${bnFaqs} Bangla`);
    };
    for (const category of categories)
      check("Category", category.slug, category.faqs.length, ["shortDesc", "body"]);
    for (const service of services)
      check("Service", service.slug, service.faqs.length, ["shortDesc", "body"]);
    for (const listingCategory of listingCategories)
      check(
        "Listing category",
        listingCategory.slug,
        listingCategory.faqs?.length ?? 0,
        listingCategory.introContent ? ["body"] : [],
      );
    const known = new Set([
      ...categories.map((c) => c.slug),
      ...services.map((s) => s.slug),
      ...listingCategories.map((l) => l.slug),
    ]);
    for (const slug of Object.keys(english)) {
      if (!known.has(slug)) errors.push(`English content for unknown slug "${slug}"`);
    }
  }

  return errors;
}
