"use client";

import { ChevronRight } from "lucide-react";

import { useT } from "@/i18n/client";
import { Link } from "@/i18n/navigation";

/** Section title (h2) with an optional "See all" link. */
export function SectionHeader({
  id,
  title,
  description,
  href,
  linkLabel,
}: {
  id?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  const t = useT();
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-xl font-bold md:text-2xl">
          {title}
        </h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex tap shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {linkLabel ?? t("common.seeAll")}
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
