import type { Metadata } from "next";

import { type Locale, localizePath } from "@/i18n/config";
import { localeAlternates, ogLocale } from "@/i18n/metadata";
import { getT } from "@/i18n/t";
import { routes } from "@/lib/routes";

import type { CatalogEntry } from "./types";

const DESCRIPTION_MAX = 155;

/** Plain-text summary of markdown (for meta descriptions): strips syntax, collapses whitespace. */
export function toPlainSummary(markdown: string, max = DESCRIPTION_MAX): string {
  const text = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function describe(entry: CatalogEntry): {
  name: string;
  slug: string;
  description: string;
  seoTitle: string | null;
} {
  if (entry.type === "category") {
    const { category } = entry;
    return {
      name: category.name,
      slug: category.slug,
      seoTitle: category.seoTitle,
      description:
        category.seoDescription ??
        category.shortDesc ??
        toPlainSummary(category.introContent ?? category.name),
    };
  }
  const { service } = entry;
  return {
    name: service.name,
    slug: service.slug,
    seoTitle: service.seoTitle,
    description:
      service.seoDescription ??
      toPlainSummary(service.description ?? service.shortDesc ?? service.name),
  };
}

/**
 * Title, description, canonical + hreflang and Open Graph for `/services/[slug]` in `locale`
 * (the entry is already resolved for that language). OG images arrive in P14.
 */
export function catalogMetadata(entry: CatalogEntry, locale: Locale): Metadata {
  const t = getT(locale);
  const { name, slug, description, seoTitle } = describe(entry);
  const title = seoTitle ?? t("common.nameInBogura", { name });
  const path = routes.service(slug);
  const alternates = localeAlternates(locale, path);
  return {
    title,
    description,
    alternates,
    openGraph: {
      type: "website",
      siteName: t("common.siteName"),
      title,
      description,
      url: localizePath(locale, path),
      ...ogLocale(locale),
    },
  };
}
