"use client";

import type { AreaGroup } from "@/features/account/queries";
import { toServerPayload, type RequestFormValues } from "@/features/forms/build-zod";
import { DynamicForm, type SubmitResult } from "@/features/forms/components/dynamic-form";
import type { FormSchema, ServiceFormPresets } from "@/features/forms/types";
import { useLocaleRouter } from "@/i18n/navigation";

import { createPhoneRequest } from "../requests/admin-actions";

type Target = { kind: "service"; slug: string } | { kind: "custom" };

/** The customer's form, filled in by an operator during a phone call (source = PHONE). */
export function PhoneRequestForm({
  target,
  schema,
  presets,
  areaGroups,
  defaultValues,
}: {
  target: Target;
  schema: FormSchema;
  presets: ServiceFormPresets;
  areaGroups: AreaGroup[];
  defaultValues: RequestFormValues;
}) {
  const router = useLocaleRouter();

  async function submit(values: RequestFormValues): Promise<SubmitResult> {
    const result = await createPhoneRequest({ target, payload: toServerPayload(schema, values) });
    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
        fieldErrors:
          "fieldErrors" in result ? (result.fieldErrors as Record<string, string>) : undefined,
      };
    }
    router.push(`/admin/requests/${result.data.code}`);
    return { ok: true };
  }

  return (
    <DynamicForm
      schema={schema}
      presets={presets}
      areaGroups={areaGroups}
      defaultValues={defaultValues}
      onSubmit={submit}
    />
  );
}
