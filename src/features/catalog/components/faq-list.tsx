import { ChevronDown } from "lucide-react";

import { SectionHeader } from "@/components/section-header";

import type { Faq } from "../faqs";

/** Accessible, JS-free accordion (native <details>). Mirrors the FAQPage JSON-LD. */
export function FaqList({ faqs, title = "সাধারণ প্রশ্ন" }: { faqs: Faq[]; title?: string }) {
  if (!faqs.length) return null;
  return (
    <section aria-labelledby="faq-title">
      <SectionHeader id="faq-title" title={title} />
      <div className="flex flex-col gap-2">
        {faqs.map((faq) => (
          <details key={faq.q} className="group rounded-xl border bg-card px-4 open:shadow-xs">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 font-medium [&::-webkit-details-marker]:hidden">
              {faq.q}
              <ChevronDown
                className="size-5 shrink-0 text-muted-foreground transition group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="pb-4 leading-relaxed text-muted-foreground">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
