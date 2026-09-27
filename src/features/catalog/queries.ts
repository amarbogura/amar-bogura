import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { ServiceCardData } from "@/components/service-card";
import { TAGS } from "@/lib/cache-tags";
import { db } from "@/lib/db";

import { parseFaqs } from "./faqs";
import type { CatalogEntry } from "./types";

const serviceCardSelect = {
  slug: true,
  nameBn: true,
  shortDescBn: true,
  iconKey: true,
  startingPrice: true,
  isEmergency: true,
} as const;

/**
 * `/services/[slug]` resolves a Category OR a Service (unique across both, D-14). Only ACTIVE rows;
 * a service also needs an ACTIVE category. Returns null → 404.
 */
export async function resolveCatalogSlug(slug: string): Promise<CatalogEntry | null> {
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
      iconKey: true,
      introContent: true,
      seoTitle: true,
      seoDescription: true,
      faqs: true,
      services: {
        where: { status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
        select: serviceCardSelect,
      },
    },
  });
  if (category) {
    return { type: "category", category: { ...category, faqs: parseFaqs(category.faqs) } };
  }

  const service = await db.service.findFirst({
    where: { slug, status: "ACTIVE", category: { status: "ACTIVE" } },
    select: {
      ...serviceCardSelect,
      id: true,
      nameEn: true,
      description: true,
      priceNote: true,
      seoTitle: true,
      seoDescription: true,
      faqs: true,
      category: { select: { slug: true, nameBn: true, kind: true } },
    },
  });
  if (service) {
    return { type: "service", service: { ...service, faqs: parseFaqs(service.faqs) } };
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
  if (picked.length >= limit) return picked;

  const siblings = await db.service.findMany({
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
  return [...picked, ...siblings];
}
