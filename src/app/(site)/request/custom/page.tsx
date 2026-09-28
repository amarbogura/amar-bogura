import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { RequestFormSection } from "@/features/requests/components/request-form-section";
import { resolveCustomRequestForm } from "@/features/requests/resolve-form";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "কাস্টম রিকোয়েস্ট — যা খুঁজছেন তা না পেলে",
  description:
    "তালিকায় নেই এমন যেকোনো কাজ বা জিনিসের জন্য বগুড়ায় রিকোয়েস্ট দিন। লগইন ছাড়াই, আমাদের টিম আপনাকে ফোন করবে।",
  alternates: { canonical: routes.customRequest },
};

/** D-07: custom request = its own template, type CUSTOM, no service. */
export default async function CustomRequestPage() {
  const form = await resolveCustomRequestForm();
  if (!form) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-4 md:py-8">
      <Breadcrumbs items={[{ label: "হোম", href: routes.home }, { label: "কাস্টম রিকোয়েস্ট" }]} />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">কাস্টম রিকোয়েস্ট</h1>
        <p className="text-sm text-muted-foreground">
          যা দরকার তা তালিকায় খুঁজে না পেলে এখানে লিখুন — আমরা ব্যবস্থা করার চেষ্টা করব।
        </p>
      </div>
      <RequestFormSection form={form} path={routes.customRequest} />
    </div>
  );
}
