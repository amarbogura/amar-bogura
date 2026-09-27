/**
 * Idempotent seed: `pnpm db:seed` (safe to run repeatedly).
 *
 * Default is create-only — rows that already exist are left untouched, so re-seeding production
 * never overwrites admin edits. `pnpm db:seed -- --overwrite` re-applies the seed sources to
 * existing catalog/CMS rows (development). Form template versions are immutable either way: a
 * changed template source only produces a warning (new versions come from the admin builder, P12).
 */
import "./load-env";

import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import { PrismaNeon } from "@prisma/adapter-neon";
import { hashPassword } from "better-auth/crypto";

import { env } from "@/env";
import { formTemplates } from "@/features/forms/templates";
import { type Prisma, PrismaClient } from "@/generated/prisma/client";

import { validateSeedData } from "./checks";
import { areas } from "./data/areas";
import { categories } from "./data/catalog";
import { homeSections, pages, siteSettings } from "./data/cms";

const overwrite = process.argv.includes("--overwrite");
const db = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: env.DATABASE_URL_UNPOOLED }),
});

const json = (value: unknown) => value as Prisma.InputJsonValue;
const log = (message: string) => process.stdout.write(`${message}\n`);

async function seedAreas() {
  const idBySlug = new Map<string, string>();
  for (const [index, area] of areas.entries()) {
    const data = {
      nameBn: area.nameBn,
      nameEn: area.nameEn,
      type: area.type,
      parentId: area.parentSlug ? idBySlug.get(area.parentSlug) : null,
      sortOrder: index,
    };
    const row = await db.area.upsert({
      where: { slug: area.slug },
      create: { slug: area.slug, ...data },
      update: overwrite ? data : {},
    });
    idBySlug.set(area.slug, row.id);
  }
}

async function seedFormTemplates(): Promise<Map<string, string>> {
  const idByKey = new Map<string, string>();
  for (const seed of formTemplates) {
    const meta = { name: seed.name, kind: seed.kind, description: seed.description ?? null };
    const template = await db.formTemplate.upsert({
      where: { key: seed.key },
      create: { key: seed.key, ...meta },
      update: overwrite ? meta : {},
      include: { currentVersion: true, versions: { orderBy: { version: "desc" }, take: 1 } },
    });
    idByKey.set(seed.key, template.id);

    const latest = template.versions[0];
    const current = template.currentVersion ?? latest;
    if (!latest) {
      const created = await db.formTemplateVersion.create({
        data: {
          templateId: template.id,
          version: 1,
          schema: json(seed.schema),
          changelog: "Initial version (seed)",
        },
      });
      if (!template.currentVersionId) {
        await db.formTemplate.update({
          where: { id: template.id },
          data: { currentVersionId: created.id },
        });
      }
    } else if (current && !isDeepStrictEqual(current.schema, seed.schema)) {
      if (!overwrite) {
        console.warn(
          `⚠ Template "${seed.key}" source differs from its current version (v${current.version}). ` +
            "Run `pnpm db:seed -- --overwrite` to publish it as a new version.",
        );
        continue;
      }
      // Versions are immutable (docs/03 §3.7): publish the source as the next version.
      const next = await db.formTemplateVersion.create({
        data: {
          templateId: template.id,
          version: latest.version + 1,
          schema: json(seed.schema),
          changelog: "Seed update",
        },
      });
      await db.formTemplate.update({
        where: { id: template.id },
        data: { currentVersionId: next.id },
      });
      log(`Template "${seed.key}": published v${next.version}`);
    }
  }
  return idByKey;
}

async function seedCatalog(templateIds: Map<string, string>) {
  const templateId = (key?: string) => (key ? templateIds.get(key) : undefined) ?? null;
  const touchedServices: Array<{ id: string; related: string[] }> = [];

  for (const [categoryIndex, category] of categories.entries()) {
    const categoryData = {
      kind: category.kind,
      nameBn: category.nameBn,
      nameEn: category.nameEn,
      shortDescBn: category.shortDescBn,
      iconKey: category.iconKey,
      sortOrder: categoryIndex,
      showOnHome: category.showOnHome ?? true,
      keywords: category.keywords,
      introContent: category.introContent,
      faqs: json(category.faqs),
      defaultFormTemplateId: templateId(category.defaultTemplate),
    };
    const categoryRow = await db.category.upsert({
      where: { slug: category.slug },
      create: { slug: category.slug, ...categoryData },
      update: overwrite ? categoryData : {},
    });

    for (const [index, service] of (category.services ?? []).entries()) {
      const serviceData = {
        categoryId: categoryRow.id,
        nameBn: service.nameBn,
        nameEn: service.nameEn,
        shortDescBn: service.shortDescBn,
        description: service.description,
        iconKey: service.iconKey,
        keywords: service.keywords,
        priceNote: service.priceNote ?? null,
        sortOrder: index,
        isFeatured: service.isFeatured ?? false,
        isEmergency: service.isEmergency ?? false,
        allowGuest: service.allowGuest ?? true,
        formTemplateId: templateId(service.template),
        formPresets: json(service.formPresets ?? {}),
        faqs: json(service.faqs),
      };
      const existing = await db.service.findUnique({ where: { slug: service.slug } });
      const row = await db.service.upsert({
        where: { slug: service.slug },
        create: { slug: service.slug, ...serviceData },
        update: overwrite ? serviceData : {},
      });
      if (!existing || overwrite)
        touchedServices.push({ id: row.id, related: service.related ?? [] });
    }

    for (const [index, listingCategory] of (category.listingCategories ?? []).entries()) {
      const data = {
        categoryId: categoryRow.id,
        nameBn: listingCategory.nameBn,
        nameEn: listingCategory.nameEn,
        iconKey: listingCategory.iconKey,
        sortOrder: index,
        propertyPurpose: listingCategory.propertyPurpose ?? null,
        propertyTypes: listingCategory.propertyTypes ?? [],
        formTemplateId: templateId(listingCategory.template),
        introContent: listingCategory.introContent ?? null,
        faqs: json(listingCategory.faqs ?? []),
      };
      await db.listingCategory.upsert({
        where: { slug: listingCategory.slug },
        create: { slug: listingCategory.slug, ...data },
        update: overwrite ? data : {},
      });
    }
  }

  // Related services need every service to exist first. `set` replaces, so re-runs don't duplicate.
  for (const { id, related } of touchedServices) {
    await db.service.update({
      where: { id },
      data: { relatedTo: { set: related.map((slug) => ({ slug })) } },
    });
  }
}

async function seedCms() {
  for (const setting of siteSettings) {
    await db.siteSetting.upsert({
      where: { key: setting.key },
      create: { key: setting.key, value: json(setting.value) },
      update: overwrite ? { value: json(setting.value) } : {},
    });
  }
  for (const page of pages) {
    const { slug, ...data } = page;
    await db.page.upsert({ where: { slug }, create: page, update: overwrite ? data : {} });
  }
  for (const [index, section] of homeSections.entries()) {
    const data = {
      type: section.type,
      titleBn: section.titleBn,
      config: json(section.config),
      sortOrder: index,
    };
    await db.homeSection.upsert({
      where: { key: section.key },
      create: { key: section.key, ...data },
      update: overwrite ? data : {},
    });
  }
}

/** Creates the first SUPER_ADMIN once. Never changes an existing user's password or role. */
async function seedSuperAdmin(admin: { email: string; password: string; name: string }) {
  const email = admin.email.toLowerCase();
  if (await db.user.findUnique({ where: { email } })) return "exists";

  const userId = randomUUID();
  await db.user.create({
    data: {
      id: userId,
      email,
      name: admin.name,
      emailVerified: true,
      role: "super_admin",
      accounts: {
        create: {
          id: randomUUID(),
          accountId: userId,
          providerId: "credential",
          password: await hashPassword(admin.password),
        },
      },
    },
  });
  return "created";
}

async function report() {
  const [
    areaCount,
    categoryCount,
    serviceCount,
    listingCategoryCount,
    templateCount,
    versionCount,
  ] = await Promise.all([
    db.area.count(),
    db.category.count(),
    db.service.count(),
    db.listingCategory.count(),
    db.formTemplate.count(),
    db.formTemplateVersion.count(),
  ]);
  const [settingCount, pageCount, sectionCount, adminCount] = await Promise.all([
    db.siteSetting.count(),
    db.page.count(),
    db.homeSection.count(),
    db.user.count({ where: { role: "super_admin" } }),
  ]);
  const trgm = await db.$queryRaw<Array<{ indexname: string }>>`
    SELECT indexname::text AS indexname FROM pg_indexes WHERE indexname LIKE '%\\_trgm' ORDER BY indexname`;

  log("\nSeed complete:");
  const counts = {
    areas: areaCount,
    categories: categoryCount,
    services: serviceCount,
    listingCategories: listingCategoryCount,
    formTemplates: templateCount,
    formTemplateVersions: versionCount,
    siteSettings: settingCount,
    pages: pageCount,
    homeSections: sectionCount,
    superAdmins: adminCount,
    trigramIndexes: trgm.length,
  };
  for (const [name, count] of Object.entries(counts)) log(`  ${name.padEnd(22)} ${count}`);
}

async function main() {
  const problems = validateSeedData({ categories, templates: formTemplates, areas, homeSections });
  if (problems.length) {
    throw new Error(`Seed data is invalid:\n- ${problems.join("\n- ")}`);
  }
  const { SEED_SUPER_ADMIN_EMAIL, SEED_SUPER_ADMIN_PASSWORD, SEED_SUPER_ADMIN_NAME } = env;
  if (!SEED_SUPER_ADMIN_EMAIL || !SEED_SUPER_ADMIN_PASSWORD || !SEED_SUPER_ADMIN_NAME) {
    throw new Error(
      "Set SEED_SUPER_ADMIN_EMAIL, SEED_SUPER_ADMIN_PASSWORD (>= 12 chars) and " +
        "SEED_SUPER_ADMIN_NAME in .env.local before seeding.",
    );
  }

  log(`Seeding (${overwrite ? "overwrite" : "create-only"} mode)…`);
  await seedAreas();
  const templateIds = await seedFormTemplates();
  await seedCatalog(templateIds);
  await seedCms();
  const admin = await seedSuperAdmin({
    email: SEED_SUPER_ADMIN_EMAIL,
    password: SEED_SUPER_ADMIN_PASSWORD,
    name: SEED_SUPER_ADMIN_NAME,
  });
  log(`SUPER_ADMIN ${SEED_SUPER_ADMIN_EMAIL}: ${admin}`);
  await report();
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
