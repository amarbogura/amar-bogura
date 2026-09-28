"use client";

import { ChevronRight } from "lucide-react";

import { useT } from "@/i18n/client";
import { Link } from "@/i18n/navigation";

export interface Crumb {
  label: string;
  href?: string;
}

/** Visual breadcrumbs; the last crumb is the current page. JSON-LD BreadcrumbList is added in P4. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const t = useT();
  return (
    <nav aria-label={t("common.breadcrumb")} className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-foreground hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={isLast ? "text-foreground" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight className="size-3.5" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
