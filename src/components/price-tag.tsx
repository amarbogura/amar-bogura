import { formatTaka } from "@/lib/money";
import { cn } from "@/lib/utils";

/** `৳১,২০০`, `৳৮,০০০/মাস`, optional "আলোচনা সাপেক্ষে", or "থেকে শুরু" for starting prices. */
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
  if (amount == null) {
    return (
      <span className={cn("text-sm text-muted-foreground", className)}>দাম আলোচনা সাপেক্ষে</span>
    );
  }
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1", className)}>
      <span className="font-semibold text-primary">
        {formatTaka(amount)}
        {perMonth && <span className="text-sm font-normal text-muted-foreground">/মাস</span>}
      </span>
      {from && <span className="text-sm text-muted-foreground">থেকে শুরু</span>}
      {negotiable && <span className="text-xs text-muted-foreground">(আলোচনা সাপেক্ষে)</span>}
    </span>
  );
}
