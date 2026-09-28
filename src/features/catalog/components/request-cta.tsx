"use client";

import { ArrowRight } from "lucide-react";

import { useT } from "@/i18n/client";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** The primary action on service pages: big, full width on mobile. */
export function RequestCta({
  href,
  label,
  note,
  emergency = false,
}: {
  href: string;
  label?: string;
  note?: string;
  emergency?: boolean;
}) {
  const t = useT();
  const noteText = note ?? t("catalog.requestNote");
  return (
    <div className="flex flex-col gap-1.5 sm:items-start">
      <Link
        href={href}
        className={cn(
          "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-6 text-lg font-semibold shadow-sm transition sm:w-auto",
          emergency
            ? "bg-emergency text-emergency-foreground hover:bg-emergency/90"
            : "bg-cta text-cta-foreground hover:bg-cta/90",
        )}
      >
        {label ?? t("catalog.requestCta")}
        <ArrowRight className="size-5" aria-hidden="true" />
      </Link>
      {noteText && (
        <p className="text-center text-xs text-muted-foreground sm:text-left">{noteText}</p>
      )}
    </div>
  );
}
