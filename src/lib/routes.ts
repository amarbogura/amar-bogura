// Every public URL in one place (D-14). Later phases build these pages; links are stable now.
import type { CategoryKind } from "@/generated/prisma/enums";

export const routes = {
  home: "/",
  search: (q?: string) => (q ? `/search?q=${encodeURIComponent(q)}` : "/search"),
  service: (slug: string) => `/services/${slug}`,
  serviceRequest: (slug: string) => `/services/${slug}/request`,
  buySell: "/buy-sell",
  buySellCategory: (slug: string) => `/buy-sell/${slug}`,
  buySellItem: (code: string) => `/buy-sell/item/${code}`,
  property: "/property",
  propertyForSale: "/property?purpose=sale",
  propertyItem: (code: string) => `/property/item/${code}`,
  customRequest: "/request/custom",
  ambulance: "/emergency/ambulance",
  track: "/track",
  login: "/login",
  account: "/account",
  myRequests: "/account/requests",
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
