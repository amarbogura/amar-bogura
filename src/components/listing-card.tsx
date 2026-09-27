import { ImageOff, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { PriceTag } from "@/components/price-tag";
import { relativeTimeBn } from "@/lib/contact-links";

export interface ListingCardData {
  href: string;
  title: string;
  price: number | null;
  perMonth: boolean;
  negotiable: boolean;
  areaNameBn: string;
  imageUrl: string | null;
  publishedAt: Date | string;
}

/** Buy & Sell / Property card (data arrives in P9/P10). `now` makes the relative time testable. */
export function ListingCard({ listing, now }: { listing: ListingCardData; now?: Date }) {
  return (
    <Link
      href={listing.href}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-xs transition hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="relative aspect-[4/3] bg-muted">
        {listing.imageUrl ? (
          <Image
            src={listing.imageUrl}
            alt=""
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            className="object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8" aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <span className="line-clamp-2 font-medium text-foreground">{listing.title}</span>
        <PriceTag
          amount={listing.price}
          perMonth={listing.perMonth}
          negotiable={listing.negotiable}
        />
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5" aria-hidden="true" />
          {listing.areaNameBn} · {relativeTimeBn(listing.publishedAt, now)}
        </span>
      </div>
    </Link>
  );
}
