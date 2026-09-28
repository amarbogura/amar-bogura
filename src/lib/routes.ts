// Every public URL in one place (D-14). Later phases build these pages; links are stable now.
import type { CategoryKind } from "@/generated/prisma/enums";

/** Services whose canonical page is not `/services/[slug]` (docs/04 P4: dedicated ambulance page). */
export const DEDICATED_SERVICE_PAGES: Readonly<Record<string, string>> = {
  ambulance: "/emergency/ambulance",
};

export const routes = {
  home: "/",
  search: (q?: string) => (q ? `/search?q=${encodeURIComponent(q)}` : "/search"),
  service: (slug: string) => DEDICATED_SERVICE_PAGES[slug] ?? `/services/${slug}`,
  serviceRequest: (slug: string) => `/services/${slug}/request`,
  buySell: "/buy-sell",
  buySellCategory: (slug: string) => `/buy-sell/${slug}`,
  buySellItem: (code: string) => `/buy-sell/item/${code}`,
  property: "/property",
  propertyForSale: "/property?purpose=sale",
  propertyItem: (code: string) => `/property/item/${code}`,
  customRequest: "/request/custom",
  requestSuccess: (code: string) => `/request/success/${code}`,
  ambulance: "/emergency/ambulance",
  track: "/track",
  trackRequest: (code: string) => `/track/${code}`,
  login: "/login",
  account: "/account",
  myRequests: "/account/requests",
  myRequest: (code: string) => `/account/requests/${code}`,
  newListing: "/account/listings/new",
  page: (slug: "about" | "contact" | "help" | "terms" | "privacy" | "report") => `/${slug}`,
} as const;

/** Where a homepage category card leads, by kind (docs/04 P4 "category-kind routing"). */
export function categoryHref(kind: CategoryKind, slug: string): string {
  switch (kind) {
    case "SERVICE":
      return routes.service(slug);
    case "MARKETPLACE":
      return routes.buySell;
    case "PROPERTY":
      return routes.property;
    case "CUSTOM_REQUEST":
      return routes.customRequest;
  }
}
