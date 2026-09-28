import { Link } from "@/i18n/navigation";

import { Icon } from "@/components/icon";
import { PriceTag } from "@/components/price-tag";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export interface ServiceCardData {
  slug: string;
  /** Resolved for the page's language (queries use pick()). */
  name: string;
  shortDesc: string | null;
  iconKey: string | null;
  startingPrice: number | null;
  isEmergency: boolean;
}

export function ServiceCard({ service }: { service: ServiceCardData }) {
  return (
    <Link
      href={routes.service(service.slug)}
      className="group flex h-full items-start gap-3 rounded-2xl border bg-card p-4 shadow-xs transition hover:border-primary/40 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl",
          service.isEmergency ? "bg-cta-tint text-emergency" : "bg-primary-tint text-primary",
        )}
      >
        <Icon name={service.iconKey} className="size-5" />
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="font-semibold text-foreground">{service.name}</span>
        {service.shortDesc && (
          <span className="line-clamp-2 text-sm text-muted-foreground">{service.shortDesc}</span>
        )}
        {service.startingPrice != null && (
          <PriceTag amount={service.startingPrice} from className="text-sm" />
        )}
      </span>
    </Link>
  );
}
