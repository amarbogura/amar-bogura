import { LogIn } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/skeletons";
import { env } from "@/env";
import type { Locale } from "@/i18n/config";
import { getT } from "@/i18n/server";
import { getAreaGroups, getUserAreaId } from "@/features/account/queries";
import { initialValues } from "@/features/forms/defaults";
import { isTempName } from "@/lib/auth-policy";
import { getSession } from "@/lib/session";

import type { RequestFormContext } from "../resolve-form";
import { RequestForm } from "./request-form";

async function RequestFormLoader({
  form,
  path,
  locale,
}: {
  form: RequestFormContext;
  path: string;
  locale: Locale;
}) {
  const t = getT(locale);
  const [session, areaGroups] = await Promise.all([getSession(), getAreaGroups(locale)]);
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
            {t("requests.loginHintBefore")}{" "}
            <Link
              href={`/login?next=${encodeURIComponent(path)}`}
              className="font-medium text-primary underline"
            >
              {t("requests.loginHintLink")}
            </Link>{" "}
            {t("requests.loginHintAfter")}
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
export function RequestFormSection({
  form,
  path,
  locale,
}: {
  form: RequestFormContext;
  path: string;
  locale: Locale;
}) {
  return (
    <Suspense fallback={<PageSkeleton label={getT(locale)("common.formLoading")} />}>
      <RequestFormLoader form={form} path={path} locale={locale} />
    </Suspense>
  );
}
