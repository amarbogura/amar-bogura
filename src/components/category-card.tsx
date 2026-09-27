import Link from "next/link";

import { Icon } from "@/components/icon";
import type { CategoryKind } from "@/generated/prisma/enums";
import { categoryHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

export interface CategoryCardData {
  slug: string;
  kind: CategoryKind;
  nameBn: string;
  iconKey: string;
}

/** Homepage parent-category tile: tinted icon + 2-line Bangla name. Emergency gets the orange accent. */
export function CategoryCard({ category }: { category: CategoryCardData }) {
  const isEmergency = category.slug === "emergency";
  return (
    <Link
      href={categoryHref(category.kind, category.slug)}
      className="group flex min-h-28 flex-col items-center justify-start gap-2 rounded-2xl border bg-card px-2 py-3 text-center shadow-xs transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-full",
          isEmergency ? "bg-cta-tint text-emergency" : "bg-primary-tint text-primary",
        )}
      >
        <Icon name={category.iconKey} className="size-6" />
      </span>
      <span className="line-clamp-3 text-[13px] leading-tight font-medium text-foreground sm:text-sm">
        {category.nameBn}
      </span>
    </Link>
  );
}
