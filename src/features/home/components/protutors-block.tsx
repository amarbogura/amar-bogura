import { GraduationCap } from "lucide-react";
import Link from "next/link";

import { routes } from "@/lib/routes";

const HIGHLIGHTS = ["প্লে থেকে এইচএসসি", "ভর্তি প্রস্তুতি", "ইংলিশ ভার্সন ও মাদ্রাসা"];

/** D-18 (decided: in-app): branded Education block → Home Tutor request. */
export function ProTutorsBlock({ titleBn }: { titleBn: string }) {
  return (
    <section
      aria-labelledby="protutors-title"
      className="overflow-hidden rounded-3xl bg-navy p-6 text-navy-foreground md:flex md:items-center md:justify-between md:gap-8 md:p-8"
    >
      <div className="flex flex-col gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
          <GraduationCap className="size-7" aria-hidden="true" />
        </span>
        <h2 id="protutors-title" className="text-xl font-bold text-white md:text-2xl">
          {titleBn}
        </h2>
        <p className="max-w-md text-sm text-white/85">
          আপনার সন্তানের জন্য বগুড়ায় যোগ্য গৃহশিক্ষক — শ্রেণি, বিষয় ও বাজেট জানিয়ে রিকোয়েস্ট
          করুন।
        </p>
        <ul className="flex flex-wrap gap-2">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="rounded-full bg-white/10 px-3 py-1 text-xs">
              {item}
            </li>
          ))}
        </ul>
      </div>
      <Link
        href={routes.service("home-tutor")}
        className="mt-5 inline-flex tap shrink-0 items-center justify-center rounded-xl bg-cta px-6 font-semibold text-cta-foreground hover:bg-cta/90 md:mt-0"
      >
        টিউটর রিকোয়েস্ট করুন
      </Link>
    </section>
  );
}
