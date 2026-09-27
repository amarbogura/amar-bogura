import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { validateTemplate } from "@/features/forms/meta-schema";
import { formTemplates } from "@/features/forms/templates";

export const metadata: Metadata = {
  title: "Form templates",
  robots: { index: false, follow: false },
};

/** Development-only index of every form template (docs/04 P6). */
export default function DevFormsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">ফর্ম টেমপ্লেট ({formTemplates.length})</h1>
      <ul className="grid gap-2 sm:grid-cols-2">
        {formTemplates.map((template) => {
          const issues = validateTemplate(template.schema);
          return (
            <li key={template.key}>
              <Link
                href={`/dev/forms/${template.key}`}
                className="flex min-h-12 items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 hover:border-primary/40"
              >
                <span>
                  <span className="font-medium">{template.name}</span>
                  <span className="block font-mono text-xs text-muted-foreground">
                    {template.key} · {template.kind}
                  </span>
                </span>
                <span className="text-sm">{issues.length ? `❌ ${issues.length}` : "✅"}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
