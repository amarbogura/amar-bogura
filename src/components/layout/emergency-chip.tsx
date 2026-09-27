"use client";

import { Siren } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { telHref } from "@/lib/contact-links";
import { routes } from "@/lib/routes";

/**
 * Floating mobile chip (docs/04 P3). Calls the ambulance number directly when configured; until the
 * admin sets it, it opens the ambulance page (which also has the request form). Hidden on the
 * emergency pages themselves, which already show a large call button.
 */
export function EmergencyChip({ ambulancePhone }: { ambulancePhone: string | null }) {
  const pathname = usePathname();
  const tel = telHref(ambulancePhone);
  if (pathname.startsWith("/emergency")) return null;
  const className =
    "fixed right-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 inline-flex min-h-11 items-center gap-2 rounded-full bg-emergency px-4 text-sm font-semibold text-emergency-foreground shadow-lg md:hidden";
  const content = (
    <>
      <Siren className="size-5" aria-hidden="true" />
      অ্যাম্বুলেন্স
    </>
  );
  return tel ? (
    <a href={tel} className={className} aria-label="জরুরি অ্যাম্বুলেন্সে কল করুন">
      {content}
    </a>
  ) : (
    <Link href={routes.ambulance} className={className} aria-label="জরুরি অ্যাম্বুলেন্স">
      {content}
    </Link>
  );
}
