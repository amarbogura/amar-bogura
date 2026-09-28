"use client";

import { ClipboardPen, PhoneCall, Wrench } from "lucide-react";

import { SectionHeader } from "@/components/section-header";
import { useLocale, useT } from "@/i18n/client";
import { toLocaleDigits } from "@/i18n/format";

const STEPS = [
  { icon: ClipboardPen, title: "catalog.how1Title", text: "catalog.how1Text" },
  { icon: PhoneCall, title: "catalog.how2Title", text: "catalog.how2Text" },
  { icon: Wrench, title: "catalog.how3Title", text: "catalog.how3Text" },
] as const;

/** Same three steps for every service (the schema has no per-service "what's included" yet). */
export function HowItWorks() {
  const t = useT();
  const locale = useLocale();
  return (
    <section aria-labelledby="how-title">
      <SectionHeader id="how-title" title={t("catalog.howTitle")} />
      <ol className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3 rounded-2xl border bg-card p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
              <step.icon className="size-5" aria-hidden="true" />
            </span>
            <span className="flex flex-col gap-1">
              <span className="font-semibold">
                <span className="sr-only">
                  {t("common.step", { n: toLocaleDigits(index + 1, locale) })}:{" "}
                </span>
                {t(step.title)}
              </span>
              <span className="text-sm text-muted-foreground">{t(step.text)}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
