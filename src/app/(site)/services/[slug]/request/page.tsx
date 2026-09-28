import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageSkeleton } from "@/components/skeletons";
import { EmergencyCallBar } from "@/features/requests/components/emergency-call-bar";
import { RequestFormSection } from "@/features/requests/components/request-form-section";
import {
  getRequestFormStaticParams,
  resolveServiceRequestForm,
} from "@/features/requests/resolve-form";
import { getSiteSettings } from "@/features/site/queries";
import { routes } from "@/lib/routes";

export async function generateStaticParams() {
  return getRequestFormStaticParams();
}

export async function generateMetadata({
  params,
}: PageProps<"/services/[slug]/request">): Promise<Metadata> {
  const form = await resolveServiceRequestForm((await params).slug);
  if (!form) return {};
  return {
    title: `${form.titleBn} — রিকোয়েস্ট করুন`,
    // The service page is the indexable one; the form is a step in its flow.
    robots: { index: false, follow: true },
  };
}

async function ServiceRequest({
  params,
}: {
  params: PageProps<"/services/[slug]/request">["params"];
}) {
  const { slug } = await params;
  const form = await resolveServiceRequestForm(slug);
  if (!form) notFound();
  const settings = form.isEmergency ? await getSiteSettings() : null;

  return (
    <>
      {settings && <EmergencyCallBar ambulancePhone={settings.ambulancePhone} />}
      <Breadcrumbs
        items={[
          { label: "হোম", href: routes.home },
          ...(form.category && !form.isEmergency
            ? [{ label: form.category.nameBn, href: routes.service(form.category.slug) }]
            : []),
          { label: form.titleBn, href: routes.service(slug) },
          { label: "রিকোয়েস্ট" },
        ]}
      />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{form.titleBn} — রিকোয়েস্ট</h1>
        <p className="text-sm text-muted-foreground">
          তথ্যগুলো দিন, আমাদের টিম যাচাই করে আপনাকে ফোন করবে। কোনো অগ্রিম টাকা লাগে না।
        </p>
      </div>
      <RequestFormSection form={form} path={routes.serviceRequest(slug)} />
    </>
  );
}

/**
 * docs/04 P7: the service's form (no login gate — D-03). Known services prerender fully; the
 * Suspense boundary lets admin-added slugs stream on demand.
 */
export default function ServiceRequestPage({ params }: PageProps<"/services/[slug]/request">) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-4 md:py-8">
      <Suspense fallback={<PageSkeleton label="ফর্ম লোড হচ্ছে…" />}>
        <ServiceRequest params={params} />
      </Suspense>
    </div>
  );
}
