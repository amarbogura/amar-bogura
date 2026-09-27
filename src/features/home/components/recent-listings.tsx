import { EmptyState } from "@/components/empty-state";
import { ListingCard } from "@/components/listing-card";
import { SectionHeader } from "@/components/section-header";
import { routes } from "@/lib/routes";

import { getRecentListings } from "../queries";

export async function RecentListings({ titleBn, limit }: { titleBn: string; limit: number }) {
  const listings = await getRecentListings(limit);
  return (
    <section aria-labelledby="recent-listings-title">
      <SectionHeader
        id="recent-listings-title"
        title={titleBn}
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
          title="এখনো কোনো বিজ্ঞাপন নেই"
          description="মোবাইল, ফার্নিচার, বাইক বা বাসা ভাড়া — প্রথম বিজ্ঞাপনটি আপনিই দিন।"
          action={{ href: routes.newListing, label: "বিজ্ঞাপন দিন" }}
        />
      )}
    </section>
  );
}
