"use client";

import { Siren } from "lucide-react";
import { usePathname } from "next/navigation";

import { useT } from "@/i18n/client";
import { stripLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { telHref } from "@/lib/contact-links";
import { routes } from "@/lib/routes";

/**
 * Floating mobile chip (docs/04 P3). Calls the ambulance number directly when configured; until the
 * admin sets it, it opens the ambulance page (which also has the request form). Hidden on the
 * emergency pages (and the ambulance request form), which already show a large call button.
 */
export function EmergencyChip({ ambulancePhone }: { ambulancePhone: string | null }) {
  const pathname = stripLocale(usePathname());
  const t = useT();
  const tel = telHref(ambulancePhone);
  if (pathname.startsWith("/emergency") || pathname === routes.serviceRequest("ambulance"))
    return null;
  const className =
    "fixed right-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 inline-flex min-h-11 items-center gap-2 rounded-full bg-emergency px-4 text-sm font-semibold text-emergency-foreground shadow-lg md:hidden";
  const content = (
    <>
      <Siren className="size-5" aria-hidden="true" />
      {t("nav.ambulance")}
    </>
  );
  return tel ? (
    <a href={tel} className={className} aria-label={t("nav.ambulanceCall")}>
      {content}
    </a>
  ) : (
    <Link href={routes.ambulance} className={className} aria-label={t("nav.ambulancePage")}>
      {content}
    </Link>
  );
}
