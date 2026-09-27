import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { CategoryCardData } from "@/components/category-card";
import type { ListingCardData } from "@/components/listing-card";
import type { ServiceCardData } from "@/components/service-card";
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

const serviceSelect = {
  slug: true,
  nameBn: true,
  shortDescBn: true,
  iconKey: true,
  startingPrice: true,
  isEmergency: true,
} as const;

/** The homepage parent categories — never more than 12 (CLAUDE.md scope rule). */
export async function getHomeCategories(): Promise<CategoryCardData[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.home, TAGS.catalog);
  return db.category.findMany({
    where: { status: "ACTIVE", showOnHome: true },
    orderBy: { sortOrder: "asc" },
    take: MAX_HOME_CATEGORIES,
    select: { slug: true, kind: true, nameBn: true, iconKey: true },
  });
}

export async function getHomeSections(): Promise<HomeSection[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.home, TAGS.catalog);

  const rows = await db.homeSection.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { key: true, type: true, titleBn: true, config: true },
  });
  const slugs = referencedSlugs(rows);

  const [services, categories] = await Promise.all([
    db.service.findMany({
      where: { slug: { in: slugs.services }, status: "ACTIVE", category: { status: "ACTIVE" } },
      select: serviceSelect,
    }),
    db.category.findMany({
      where: { slug: { in: slugs.categories }, status: "ACTIVE" },
      select: {
        slug: true,
        kind: true,
        nameBn: true,
        iconKey: true,
        shortDescBn: true,
        services: {
          where: { status: "ACTIVE" },
          orderBy: { sortOrder: "asc" },
          select: serviceSelect,
        },
      },
    }),
  ]);

  return resolveHomeSections(
    rows,
    new Map<string, ServiceCardData>(services.map((s) => [s.slug, s])),
    new Map<string, CategoryWithServices>(categories.map((c) => [c.slug, c])),
  );
}

/** Latest approved listings for the homepage (Buy & Sell + Property). Empty until P9. */
export async function getRecentListings(limit: number): Promise<ListingCardData[]> {
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
      area: { select: { nameBn: true } },
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
    areaNameBn: listing.area.nameBn,
    imageUrl: listing.images[0]?.media.url ?? null,
    publishedAt: listing.publishedAt ?? listing.createdAt,
  }));
}
