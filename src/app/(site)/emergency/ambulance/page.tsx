import { ClipboardPen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { env } from "@/env";
import { EmergencyCall } from "@/features/catalog/components/emergency-call";
import { FaqList } from "@/features/catalog/components/faq-list";
import { JsonLd } from "@/features/catalog/components/json-ld";
import { Markdown } from "@/features/catalog/components/markdown";
import { breadcrumbJsonLd, faqJsonLd, serviceJsonLd } from "@/features/catalog/jsonld";
import { resolveCatalogSlug } from "@/features/catalog/queries";
import { getTemplate } from "@/features/forms/templates";
import { getSiteSettings } from "@/features/site/queries";
import { routes } from "@/lib/routes";

const PATH = routes.ambulance;

export const metadata: Metadata = {
  title: "জরুরি অ্যাম্বুলেন্স — বগুড়া",
  description:
    "বগুড়া থেকে যেকোনো হাসপাতালে এসি, নন-এসি, আইসিইউ ও ফ্রিজার অ্যাম্বুলেন্স। এখনই কল করুন বা লগইন ছাড়াই রিকোয়েস্ট করুন।",
  alternates: { canonical: PATH },
  openGraph: { type: "website", locale: "bn_BD", siteName: "আমার বগুড়া", url: PATH },
};

/** The ambulance "types" shown on the page come from the ambulance form template (one source). */
function ambulanceTypes(): string[] {
  const field = getTemplate("ambulance")
    ?.schema.sections.flatMap((section) => section.fields)
    .find((f) => f.key === "ambulanceType");
  return field?.options?.map((option) => option.label.bn) ?? [];
}

export default async function AmbulancePage() {
  const [settings, entry] = await Promise.all([getSiteSettings(), resolveCatalogSlug("ambulance")]);
  if (entry?.type !== "service") notFound();
  const { service } = entry;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(
            [
              { name: "হোম", path: routes.home },
              { name: "জরুরি অ্যাম্বুলেন্স", path: PATH },
            ],
            env.NEXT_PUBLIC_SITE_URL,
          ),
          serviceJsonLd(service, PATH, env.NEXT_PUBLIC_SITE_URL),
          faqJsonLd(service.faqs),
        ]}
      />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-4 md:py-8">
        {/* Call-now comes first so it is above the fold on a 360px phone. */}
        <EmergencyCall ambulancePhone={settings.ambulancePhone} />

        <Link
          href={routes.serviceRequest("ambulance")}
          className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-xs hover:border-primary/40"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cta-tint text-emergency">
            <ClipboardPen className="size-5" aria-hidden="true" />
          </span>
          <span className="flex flex-col">
            <span className="font-semibold">কল করতে পারছেন না? রিকোয়েস্ট পাঠান</span>
            <span className="text-sm text-muted-foreground">
              লগইন ছাড়াই — আমরা সাথে সাথে ফোন করব
            </span>
          </span>
        </Link>

        <Breadcrumbs
          items={[{ label: "হোম", href: routes.home }, { label: "জরুরি অ্যাম্বুলেন্স" }]}
        />

        <section aria-labelledby="types-title" className="flex flex-col gap-3">
          <h2 id="types-title" className="text-xl font-bold">
            যেসব অ্যাম্বুলেন্স পাওয়া যায়
          </h2>
          <ul className="flex flex-wrap gap-2">
            {ambulanceTypes().map((type) => (
              <li
                key={type}
                className="rounded-full bg-cta-tint px-3 py-1.5 text-sm font-medium text-emergency"
              >
                {type}
              </li>
            ))}
          </ul>
        </section>

        {service.description && <Markdown>{service.description}</Markdown>}
        <FaqList faqs={service.faqs} />
      </div>
    </>
  );
}
