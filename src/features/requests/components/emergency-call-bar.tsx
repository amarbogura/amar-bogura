import { PhoneCall } from "lucide-react";

import { NATIONAL_EMERGENCY_NUMBER, telHref } from "@/lib/contact-links";
import { formatBdPhoneDisplay } from "@/lib/phone";
import { toBanglaDigits } from "@/lib/bangla";

/** Call-now bar kept above the ambulance request form: calling is always the fastest path. */
export function EmergencyCallBar({ ambulancePhone }: { ambulancePhone: string | null }) {
  const ours = telHref(ambulancePhone);
  return (
    <a
      href={ours ?? `tel:${NATIONAL_EMERGENCY_NUMBER}`}
      className="flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-emergency px-4 text-lg font-bold text-emergency-foreground shadow-md hover:bg-emergency/90"
    >
      <PhoneCall className="size-6" aria-hidden="true" />
      এখনই কল করুন:{" "}
      {ours ? formatBdPhoneDisplay(ambulancePhone!) : toBanglaDigits(NATIONAL_EMERGENCY_NUMBER)}
    </a>
  );
}
