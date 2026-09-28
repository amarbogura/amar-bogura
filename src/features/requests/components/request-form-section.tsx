import { LogIn } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/skeletons";
import { env } from "@/env";
import { getAreaGroups, getUserAreaId } from "@/features/account/queries";
import { initialValues } from "@/features/forms/defaults";
import { isTempName } from "@/lib/auth-policy";
import { getSession } from "@/lib/session";

import type { RequestFormContext } from "../resolve-form";
import { RequestForm } from "./request-form";

async function RequestFormLoader({ form, path }: { form: RequestFormContext; path: string }) {
  const [session, areaGroups] = await Promise.all([getSession(), getAreaGroups()]);
  const user = session?.user;
  const areaId = user ? await getUserAreaId(user.id) : null;
  const defaultValues = initialValues(form.schema, {
    presets: form.presets,
    prefill: user
      ? {
          name: isTempName(user.name, user.phoneNumber) ? null : user.name,
          phone: user.phoneNumberVerified ? user.phoneNumber : null,
          areaId,
        }
      : undefined,
  });

  return (
    <>
      {!user && (
        // D-03: a soft hint only — guests can always submit.
        <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          <LogIn className="size-4 shrink-0" aria-hidden="true" />
          <span>
            লগইন করলে রিকোয়েস্ট ট্র্যাক করা সহজ।{" "}
            <Link
              href={`/login?next=${encodeURIComponent(path)}`}
              className="font-medium text-primary underline"
            >
              লগইন করুন
            </Link>{" "}
            অথবা লগইন ছাড়াই নিচের ফর্মটি পূরণ করুন।
          </span>
        </p>
      )}
      <RequestForm
        target={form.type === "CUSTOM" ? { kind: "custom" } : { kind: "service", slug: form.slug }}
        schema={form.schema}
        presets={form.presets}
        areaGroups={areaGroups}
        defaultValues={defaultValues}
        draftKey={`request:${form.slug}`}
        guest={!user}
        turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      />
    </>
  );
}

/** Session-dependent part of a request page (prefill, guest hint), streamed inside Suspense. */
export function RequestFormSection({ form, path }: { form: RequestFormContext; path: string }) {
  return (
    <Suspense fallback={<PageSkeleton label="ফর্ম লোড হচ্ছে…" />}>
      <RequestFormLoader form={form} path={path} />
    </Suspense>
  );
}
