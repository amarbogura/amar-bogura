"use client";

import { PhoneCall } from "lucide-react";

import { useLocale, useT } from "@/i18n/client";
import { toLocaleDigits } from "@/i18n/format";
import { NATIONAL_EMERGENCY_NUMBER, telHref } from "@/lib/contact-links";
import { formatBdPhoneDisplay } from "@/lib/phone";

/** Call-now bar kept above the ambulance request form: calling is always the fastest path. */
export function EmergencyCallBar({ ambulancePhone }: { ambulancePhone: string | null }) {
  const t = useT();
  const locale = useLocale();
  const ours = telHref(ambulancePhone);
  const number = ours
    ? formatBdPhoneDisplay(ambulancePhone!, locale)
    : toLocaleDigits(NATIONAL_EMERGENCY_NUMBER, locale);
  return (
    <a
      href={ours ?? `tel:${NATIONAL_EMERGENCY_NUMBER}`}
      className="flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-emergency px-4 text-lg font-bold text-emergency-foreground shadow-md hover:bg-emergency/90"
    >
      <PhoneCall className="size-6" aria-hidden="true" />
      {t("emergency.callNowBar", { number })}
    </a>
  );
}
