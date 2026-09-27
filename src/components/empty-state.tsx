import Link from "next/link";

import { Icon } from "@/components/icon";

export function EmptyState({
  icon = "package-open",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-muted/40 px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-background text-muted-foreground">
        <Icon name={icon} />
      </span>
      <p className="font-semibold">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Link
          href={action.href}
          className="inline-flex tap items-center justify-center rounded-md bg-primary px-5 font-medium text-primary-foreground hover:bg-primary/90"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
