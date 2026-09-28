import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { ServiceCardData } from "@/components/service-card";
import { serviceCardSelect, toServiceCard } from "@/features/home/queries";
import type { Locale } from "@/i18n/config";
import { pick, pickText } from "@/i18n/content";
import { TAGS } from "@/lib/cache-tags";
import { db } from "@/lib/db";

import { parseFaqs } from "./faqs";
import type { CatalogEntry } from "./types";

/**
 * `/services/[slug]` resolves a Category OR a Service (unique across both, D-14), for one language
 * (English falls back to Bangla per field). Only ACTIVE rows; a service also needs an ACTIVE
 * category. Returns null → 404.
 */
export async function resolveCatalogSlug(
  slug: string,
  locale: Locale,
): Promise<CatalogEntry | null> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.catalog, TAGS.category(slug), TAGS.service(slug));

  const category = await db.category.findFirst({
    where: { slug, status: "ACTIVE" },
    select: {
      id: true,
      slug: true,
      kind: true,
      nameBn: true,
      nameEn: true,
      shortDescBn: true,
      shortDescEn: true,
      iconKey: true,
      introContent: true,
      introContentEn: true,
      seoTitle: true,
      seoTitleEn: true,
      seoDescription: true,
      seoDescriptionEn: true,
      faqs: true,
      faqsEn: true,
      services: {
        where: { status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
        select: serviceCardSelect,
      },
    },
  });
  if (category) {
    return {
      type: "category",
      category: {
        id: category.id,
        slug: category.slug,
        kind: category.kind,
        name: pick(category, "name", locale),
        nameBn: category.nameBn,
        nameEn: category.nameEn,
        shortDesc: pick(category, "shortDesc", locale) || null,
        iconKey: category.iconKey,
        introContent: pickText(category.introContent, category.introContentEn, locale),
        seoTitle: pickText(category.seoTitle, category.seoTitleEn, locale),
        seoDescription: pickText(category.seoDescription, category.seoDescriptionEn, locale),
        faqs: pickText(parseFaqs(category.faqs), parseFaqs(category.faqsEn), locale),
        services: category.services.map((service) => toServiceCard(service, locale)),
      },
    };
  }

  const service = await db.service.findFirst({
    where: { slug, status: "ACTIVE", category: { status: "ACTIVE" } },
    select: {
      ...serviceCardSelect,
      id: true,
      description: true,
      descriptionEn: true,
      priceNote: true,
      priceNoteEn: true,
      seoTitle: true,
      seoTitleEn: true,
      seoDescription: true,
      seoDescriptionEn: true,
      faqs: true,
      faqsEn: true,
      category: { select: { slug: true, nameBn: true, nameEn: true, kind: true } },
    },
  });
  if (service) {
    return {
      type: "service",
      service: {
        ...toServiceCard(service, locale),
        id: service.id,
        nameBn: service.nameBn,
        nameEn: service.nameEn,
        description: pickText(service.description, service.descriptionEn, locale),
        priceNote: pickText(service.priceNote, service.priceNoteEn, locale),
        seoTitle: pickText(service.seoTitle, service.seoTitleEn, locale),
        seoDescription: pickText(service.seoDescription, service.seoDescriptionEn, locale),
        faqs: pickText(parseFaqs(service.faqs), parseFaqs(service.faqsEn), locale),
        category: {
          slug: service.category.slug,
          name: pick(service.category, "name", locale),
          kind: service.category.kind,
        },
      },
    };
  }
  return null;
}

/** Slugs prerendered at build: ACTIVE SERVICE-kind categories + ACTIVE services. */
export async function getCatalogStaticParams(): Promise<Array<{ slug: string }>> {
  const [categories, services] = await Promise.all([
    db.category.findMany({ where: { status: "ACTIVE", kind: "SERVICE" }, select: { slug: true } }),
    db.service.findMany({
      where: { status: "ACTIVE", category: { status: "ACTIVE" } },
      select: { slug: true },
    }),
  ]);
  return [...categories, ...services].map(({ slug }) => ({ slug }));
}

/** Admin-picked related services first, then same-category siblings; at most `limit`. */
export async function getRelatedServices(
  serviceId: string,
  categorySlug: string,
  locale: Locale,
  limit = 4,
): Promise<ServiceCardData[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.catalog, TAGS.category(categorySlug));

  const active = { status: "ACTIVE" as const, category: { status: "ACTIVE" as const } };
  const picked = await db.service.findMany({
    where: { ...active, relatedFrom: { some: { id: serviceId } } },
    orderBy: { sortOrder: "asc" },
    take: limit,
    select: serviceCardSelect,
  });
  const siblings =
    picked.length >= limit
      ? []
      : await db.service.findMany({
          where: {
            ...active,
            category: { slug: categorySlug, status: "ACTIVE" },
            id: { not: serviceId },
            slug: { notIn: picked.map((s) => s.slug) },
          },
          orderBy: { sortOrder: "asc" },
          take: limit - picked.length,
          select: serviceCardSelect,
        });
  return [...picked, ...siblings].map((service) => toServiceCard(service, locale));
}
