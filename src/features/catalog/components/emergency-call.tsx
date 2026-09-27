import { PhoneCall, Siren } from "lucide-react";

import { NATIONAL_EMERGENCY_NUMBER, telHref } from "@/lib/contact-links";
import { formatBdPhoneDisplay } from "@/lib/phone";
import { toBanglaDigits } from "@/lib/bangla";

/**
 * Call-now block for /emergency/ambulance, rendered above the fold. Our ambulance line when the
 * admin has set it; otherwise 999 (National Emergency Service), which always stays visible below.
 */
export function EmergencyCall({ ambulancePhone }: { ambulancePhone: string | null }) {
  const ours = telHref(ambulancePhone);
  const primaryHref = ours ?? `tel:${NATIONAL_EMERGENCY_NUMBER}`;
  const primaryNumber = ours
    ? formatBdPhoneDisplay(ambulancePhone!)
    : toBanglaDigits(NATIONAL_EMERGENCY_NUMBER);

  return (
    <section
      aria-labelledby="emergency-call-title"
      className="flex flex-col gap-4 rounded-3xl bg-emergency p-5 text-emergency-foreground shadow-lg md:p-8"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-white/15">
          <Siren className="size-7" aria-hidden="true" />
        </span>
        <h1 id="emergency-call-title" className="text-2xl font-bold text-white md:text-3xl">
          জরুরি অ্যাম্বুলেন্স
        </h1>
      </div>
      <a
        href={primaryHref}
        className="flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-white px-6 text-xl font-bold text-emergency shadow-md hover:bg-white/95 focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:outline-none"
      >
        <PhoneCall className="size-7" aria-hidden="true" />
        এখনই কল করুন · {primaryNumber}
      </a>
      <p className="text-sm text-white/90">
        {ours ? (
          <>
            জীবন-মরণ জরুরি অবস্থায় জাতীয় জরুরি সেবা{" "}
            <a href={`tel:${NATIONAL_EMERGENCY_NUMBER}`} className="font-bold underline">
              ৯৯৯
            </a>{" "}
            নম্বরেও কল করতে পারেন।
          </>
        ) : (
          "৯৯৯ হলো জাতীয় জরুরি সেবা (অ্যাম্বুলেন্স, পুলিশ, ফায়ার সার্ভিস) — বিনামূল্যে, ২৪ ঘণ্টা।"
        )}
      </p>
    </section>
  );
}
