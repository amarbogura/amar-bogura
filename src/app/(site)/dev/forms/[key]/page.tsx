import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/skeletons";
import { getAreaGroups } from "@/features/account/queries";
import {
  FormPlayground,
  type PlaygroundService,
} from "@/features/forms/components/form-playground";
import { validateTemplate } from "@/features/forms/meta-schema";
import { formTemplates, getTemplate } from "@/features/forms/templates";
import type { ServiceFormPresets } from "@/features/forms/types";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Form preview",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return formTemplates.map((template) => ({ key: template.key }));
}

async function Playground({ templateKey }: { templateKey: string }) {
  const template = getTemplate(templateKey);
  if (!template) notFound();
  const [areaGroups, services] = await Promise.all([
    getAreaGroups(),
    db.service.findMany({
      where: { formTemplate: { key: templateKey } },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, nameBn: true, formPresets: true },
    }),
  ]);
  const issues = validateTemplate(template.schema);
  const playgroundServices: PlaygroundService[] = services.map((service) => ({
    slug: service.slug,
    nameBn: service.nameBn,
    presets: (service.formPresets ?? {}) as ServiceFormPresets,
  }));

  return (
    <>
      <h1 className="text-2xl font-bold">{template.name}</h1>
      <p className="font-mono text-xs text-muted-foreground">
        {template.key} · {template.kind}
      </p>
      {issues.length > 0 && (
        <pre className="rounded bg-destructive/10 p-3 text-xs text-destructive">
          {JSON.stringify(issues, null, 2)}
        </pre>
      )}
      <FormPlayground
        templateKey={template.key}
        schema={template.schema}
        services={playgroundServices}
        areaGroups={areaGroups}
      />
    </>
  );
}

/** Development-only live preview of one template (docs/04 P6). */
export default async function DevFormPage({ params }: PageProps<"/dev/forms/[key]">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { key } = await params;
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8">
      <Link href="/dev/forms" className="text-sm text-primary underline">
        ← সব টেমপ্লেট
      </Link>
      <Suspense fallback={<PageSkeleton />}>
        <Playground templateKey={key} />
      </Suspense>
    </div>
  );
}
