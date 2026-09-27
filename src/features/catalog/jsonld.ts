// schema.org structured data (docs/04 P4). Pure functions → unit-tested; rendered by <JsonLd/>.
import type { Faq } from "./faqs";

export type JsonLd = Record<string, unknown>;

export interface Crumb {
  name: string;
  path: string;
}

const absolute = (siteUrl: string, path: string) => new URL(path, siteUrl).toString();

const BOGURA = [
  { "@type": "City", name: "Bogura", alternateName: "বগুড়া" },
  { "@type": "AdministrativeArea", name: "Bogura District", alternateName: "বগুড়া জেলা" },
];

export function breadcrumbJsonLd(crumbs: Crumb[], siteUrl: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absolute(siteUrl, crumb.path),
    })),
  };
}

export function serviceJsonLd(
  service: {
    slug: string;
    nameBn: string;
    nameEn: string;
    shortDescBn: string | null;
    startingPrice: number | null;
    category: { nameBn: string };
  },
  path: string,
  siteUrl: string,
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.nameBn,
    alternateName: service.nameEn,
    serviceType: service.category.nameBn,
    ...(service.shortDescBn ? { description: service.shortDescBn } : {}),
    url: absolute(siteUrl, path),
    areaServed: BOGURA,
    provider: { "@type": "Organization", name: "আমার বগুড়া", url: absolute(siteUrl, "/") },
    ...(service.startingPrice != null
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "BDT",
            price: service.startingPrice,
            description: "শুরুর মূল্য",
          },
        }
      : {}),
  };
}

/** FAQPage only when there are FAQs (Google rejects empty ones). */
export function faqJsonLd(faqs: Faq[]): JsonLd | null {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}

/** Characters that could end or break out of an inline <script>; each becomes a \uXXXX escape. */
const SCRIPT_UNSAFE = new RegExp(`[<>&${String.fromCharCode(0x2028, 0x2029)}]`, "g");
const BACKSLASH = String.fromCharCode(92);

/** JSON safe to embed in an inline <script>: no `</script>` or HTML comment breakouts. */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data).replace(
    SCRIPT_UNSAFE,
    (char) => `${BACKSLASH}u${char.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}
