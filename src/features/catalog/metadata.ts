import type { Metadata } from "next";

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
      name: category.nameBn,
      slug: category.slug,
      seoTitle: category.seoTitle,
      description:
        category.seoDescription ??
        category.shortDescBn ??
        toPlainSummary(category.introContent ?? category.nameBn),
    };
  }
  const { service } = entry;
  return {
    name: service.nameBn,
    slug: service.slug,
    seoTitle: service.seoTitle,
    description:
      service.seoDescription ??
      toPlainSummary(service.description ?? service.shortDescBn ?? service.nameBn),
  };
}

/** Title, description, canonical and Open Graph for `/services/[slug]`. OG images arrive in P14. */
export function catalogMetadata(entry: CatalogEntry): Metadata {
  const { name, slug, description, seoTitle } = describe(entry);
  const title = seoTitle ?? `${name} — বগুড়া`;
  const url = routes.service(slug);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "bn_BD",
      siteName: "আমার বগুড়া",
      title,
      description,
      url,
    },
  };
}
