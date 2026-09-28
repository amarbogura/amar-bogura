import { EmptyState } from "@/components/empty-state";
import { ListingCard } from "@/components/listing-card";
import { SectionHeader } from "@/components/section-header";
import type { Locale } from "@/i18n/config";
import { getT } from "@/i18n/server";
import { routes } from "@/lib/routes";

import { getRecentListings } from "../queries";

export async function RecentListings({
  title,
  limit,
  locale,
}: {
  title: string;
  limit: number;
  locale: Locale;
}) {
  const [listings, t] = [await getRecentListings(limit, locale), getT(locale)];
  return (
    <section aria-labelledby="recent-listings-title">
      <SectionHeader
        id="recent-listings-title"
        title={title}
        href={listings.length ? routes.buySell : undefined}
      />
      {listings.length ? (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {listings.map((listing) => (
            <li key={listing.href}>
              <ListingCard listing={listing} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon="shopping-bag"
          title={t("home.listingsEmptyTitle")}
          description={t("home.listingsEmptyText")}
          action={{ href: routes.newListing, label: t("home.postAd") }}
        />
      )}
    </section>
  );
}
