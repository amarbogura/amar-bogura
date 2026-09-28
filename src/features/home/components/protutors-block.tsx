"use client";

import { GraduationCap } from "lucide-react";

import { useT } from "@/i18n/client";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

const HIGHLIGHTS = [
  "home.protutors.highlight1",
  "home.protutors.highlight2",
  "home.protutors.highlight3",
] as const;

/** D-18 (decided: in-app): branded Education block → Home Tutor request. */
export function ProTutorsBlock({ title }: { title: string }) {
  const t = useT();
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
          {title}
        </h2>
        <p className="max-w-md text-sm text-white/85">{t("home.protutors.text")}</p>
        <ul className="flex flex-wrap gap-2">
          {HIGHLIGHTS.map((key) => (
            <li key={key} className="rounded-full bg-white/10 px-3 py-1 text-xs">
              {t(key)}
            </li>
          ))}
        </ul>
      </div>
      <Link
        href={routes.service("home-tutor")}
        className="mt-5 inline-flex tap shrink-0 items-center justify-center rounded-xl bg-cta px-6 font-semibold text-cta-foreground hover:bg-cta/90 md:mt-0"
      >
        {t("home.protutors.cta")}
      </Link>
    </section>
  );
}
