import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { CategoryCardData } from "@/components/category-card";
import type { ListingCardData } from "@/components/listing-card";
import type { ServiceCardData } from "@/components/service-card";
import type { Locale } from "@/i18n/config";
import { pick } from "@/i18n/content";
import { TAGS } from "@/lib/cache-tags";
import { db } from "@/lib/db";
import { routes } from "@/lib/routes";

import {
  type CategoryWithServices,
  type HomeSection,
  MAX_HOME_CATEGORIES,
  referencedSlugs,
  resolveHomeSections,
} from "./sections";

export const serviceCardSelect = {
  slug: true,
  nameBn: true,
  nameEn: true,
  shortDescBn: true,
  shortDescEn: true,
  iconKey: true,
  startingPrice: true,
  isEmergency: true,
} as const;

type ServiceCardRow = {
  slug: string;
  nameBn: string;
  nameEn: string;
  shortDescBn: string | null;
  shortDescEn: string | null;
  iconKey: string | null;
  startingPrice: number | null;
  isEmergency: boolean;
};

/** DB row (both languages) → card data for one language. */
export function toServiceCard(row: ServiceCardRow, locale: Locale): ServiceCardData {
  return {
    slug: row.slug,
    name: pick(row, "name", locale),
    shortDesc: pick(row, "shortDesc", locale) || null,
    iconKey: row.iconKey,
    startingPrice: row.startingPrice,
    isEmergency: row.isEmergency,
  };
}

/** The homepage parent categories — never more than 12 (CLAUDE.md scope rule). */
export async function getHomeCategories(locale: Locale): Promise<CategoryCardData[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.home, TAGS.catalog);
  const rows = await db.category.findMany({
    where: { status: "ACTIVE", showOnHome: true },
    orderBy: { sortOrder: "asc" },
    take: MAX_HOME_CATEGORIES,
    select: { slug: true, kind: true, nameBn: true, nameEn: true, iconKey: true },
  });
  return rows.map((row) => ({
    slug: row.slug,
    kind: row.kind,
    name: pick(row, "name", locale),
    iconKey: row.iconKey,
  }));
}

export async function getHomeSections(locale: Locale): Promise<HomeSection[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.home, TAGS.catalog);

  const rows = await db.homeSection.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { key: true, type: true, titleBn: true, titleEn: true, config: true },
  });
  const sectionRows = rows.map((row) => ({
    key: row.key,
    type: row.type,
    title: pick(row, "title", locale),
    config: row.config,
  }));
  const slugs = referencedSlugs(sectionRows);

  const [services, categories] = await Promise.all([
    db.service.findMany({
      where: { slug: { in: slugs.services }, status: "ACTIVE", category: { status: "ACTIVE" } },
      select: serviceCardSelect,
    }),
    db.category.findMany({
      where: { slug: { in: slugs.categories }, status: "ACTIVE" },
      select: {
        slug: true,
        kind: true,
        nameBn: true,
        nameEn: true,
        iconKey: true,
        shortDescBn: true,
        shortDescEn: true,
        services: {
          where: { status: "ACTIVE" },
          orderBy: { sortOrder: "asc" },
          select: serviceCardSelect,
        },
      },
    }),
  ]);

  return resolveHomeSections(
    sectionRows,
    new Map<string, ServiceCardData>(services.map((s) => [s.slug, toServiceCard(s, locale)])),
    new Map<string, CategoryWithServices>(
      categories.map((c) => [
        c.slug,
        {
          slug: c.slug,
          kind: c.kind,
          name: pick(c, "name", locale),
          iconKey: c.iconKey,
          shortDesc: pick(c, "shortDesc", locale) || null,
          services: c.services.map((s) => toServiceCard(s, locale)),
        },
      ]),
    ),
  );
}

/** Latest approved listings for the homepage (Buy & Sell + Property). Empty until P9. */
export async function getRecentListings(limit: number, locale: Locale): Promise<ListingCardData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.home, TAGS.listings);
  const listings = await db.listing.findMany({
    where: { status: "ACTIVE" },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: {
      code: true,
      kind: true,
      title: true,
      price: true,
      pricePeriod: true,
      negotiable: true,
      publishedAt: true,
      createdAt: true,
      area: { select: { nameBn: true, nameEn: true } },
      images: {
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { media: { select: { url: true } } },
      },
    },
  });
  return listings.map((listing) => ({
    href:
      listing.kind === "PROPERTY"
        ? routes.propertyItem(listing.code)
        : routes.buySellItem(listing.code),
    title: listing.title,
    price: listing.price,
    perMonth: listing.pricePeriod === "PER_MONTH",
    negotiable: listing.negotiable,
    areaName: pick(listing.area, "name", locale),
    imageUrl: listing.images[0]?.media.url ?? null,
    publishedAt: listing.publishedAt ?? listing.createdAt,
  }));
}
