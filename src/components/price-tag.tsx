"use client";

import { useLocale, useT } from "@/i18n/client";
import { formatTaka } from "@/lib/money";
import { cn } from "@/lib/utils";

/** `৳১,২০০` / `৳1,200`, optional "/month", "negotiable", or "starting price". */
export function PriceTag({
  amount,
  perMonth = false,
  negotiable = false,
  from = false,
  className,
}: {
  amount: number | null | undefined;
  perMonth?: boolean;
  negotiable?: boolean;
  from?: boolean;
  className?: string;
}) {
  const t = useT();
  const locale = useLocale();
  if (amount == null) {
    return (
      <span className={cn("text-sm text-muted-foreground", className)}>
        {t("price.negotiable")}
      </span>
    );
  }
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1", className)}>
      <span className="font-semibold text-primary">
        {formatTaka(amount, locale)}
        {perMonth && (
          <span className="text-sm font-normal text-muted-foreground">{t("price.perMonth")}</span>
        )}
      </span>
      {from && <span className="text-sm text-muted-foreground">{t("price.from")}</span>}
      {negotiable && (
        <span className="text-xs text-muted-foreground">{t("price.negotiableShort")}</span>
      )}
    </span>
  );
}
