"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Info, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { type FieldErrors, FormProvider, get, useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import type { AreaGroup } from "@/features/account/queries";
import type { MediaPurpose } from "@/generated/prisma/enums";
import { useLocale, useT } from "@/i18n/client";
import { toLocaleDigits } from "@/i18n/format";

import { buildDetailsSchema, buildRequestFormSchema, type RequestFormValues } from "../build-zod";
import { commonFields } from "../common-fields";
import { initialValues } from "../defaults";
import { tr } from "../schema-utils";
import type { FormField, FormSchema, ServiceFormPresets } from "../types";
import { computeVisible } from "../visibility";
import { DetailsView } from "./details-view";
import { FieldRenderer } from "./field-renderer";
import { areaNameMap, fieldId, type RenderContext } from "./render-context";

export type SubmitResult =
  { ok: true } | { ok: false; error?: string; fieldErrors?: Record<string, string> };

interface Step {
  key: string;
  title: string;
  description?: string;
  fields: Array<{ field: FormField; name: string }>;
  review?: boolean;
}

const DRAFT_PREFIX = "form-draft:";

function readDraft(key: string): { values: RequestFormValues; step: number } | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_PREFIX + key);
    return raw ? (JSON.parse(raw) as { values: RequestFormValues; step: number }) : null;
  } catch {
    return null;
  }
}

/**
 * docs/03 §3.4 — the generic renderer. One step per section (only sections with a visible field),
 * then a final step with the common fields + review for REQUEST forms. Validation = the same Zod
 * schema the server uses (buildRequestFormSchema, client mode). No template-specific code.
 */
export function DynamicForm({
  schema,
  presets,
  areaGroups,
  defaultValues,
  draftKey,
  uploadPurpose,
  onSubmit,
}: {
  schema: FormSchema;
  presets?: ServiceFormPresets;
  areaGroups: AreaGroup[];
  defaultValues?: RequestFormValues;
  /** sessionStorage key for the autosaved draft (e.g. the service slug). */
  draftKey?: string;
  uploadPurpose?: MediaPurpose;
  onSubmit: (values: RequestFormValues) => Promise<SubmitResult | void>;
}) {
  const t = useT();
  const locale = useLocale();
  const tx = (text: Parameters<typeof tr>[0]) => tr(text, locale);
  const initial = useMemo(
    () => defaultValues ?? initialValues(schema, { presets }),
    [defaultValues, schema, presets],
  );
  const resolver = useMemo(
    () => zodResolver(buildRequestFormSchema(schema, { mode: "client", presets, locale }) as never),
    [schema, presets, locale],
  );
  const methods = useForm<RequestFormValues>({
    resolver: resolver as never,
    defaultValues: initial,
    mode: "onTouched",
    shouldFocusError: false,
  });
  const { control, trigger, handleSubmit, reset, formState } = methods;
  const values = useWatch({ control }) as RequestFormValues;
  const visible = computeVisible(schema, values.details ?? {}, presets);

  const ctx: RenderContext = {
    areaGroups,
    uploadPurpose: uploadPurpose ?? (schema.kind === "LISTING" ? "LISTING" : "REQUEST"),
  };
  const areaNames = useMemo(() => areaNameMap(areaGroups), [areaGroups]);
  const common = useMemo(() => commonFields(schema), [schema]);

  const steps: Step[] = [
    ...schema.sections
      .map((section) => ({
        key: section.key,
        title: tx(section.title),
        description: tx(section.description) || undefined,
        fields: section.fields
          .filter((field) => visible.has(field.key))
          .map((field) => ({ field, name: `details.${field.key}` })),
      }))
      .filter((step) => step.fields.some(({ field }) => field.type !== "heading")),
    ...(schema.kind === "REQUEST"
      ? [
          {
            key: "__contact",
            title: t("forms.contactStep"),
            fields: common.map((field) => ({ field, name: `common.${field.key}` })),
            review: true,
          },
        ]
      : []),
  ];
  // A LISTING template may have no attribute fields at all (listing_other): one empty step.
  if (steps.length === 0) {
    steps.push({
      key: "__empty",
      title: t("forms.emptyStepTitle"),
      description: t("forms.emptyStepText"),
      fields: [],
    });
  }

  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[Math.min(stepIndex, steps.length - 1)]!;
  const isLast = stepIndex >= steps.length - 1;
  const [summary, setSummary] = useState<Array<{ name: string; message: string }>>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // ── draft autosave (docs/03 §3.5) ──
  useEffect(() => {
    if (!draftKey) return;
    const draft = readDraft(draftKey);
    if (draft) {
      reset(draft.values);
      // sessionStorage can only be read after hydration, so restoring the draft's step is a
      // one-time sync from an external store on mount — the legitimate effect → state case.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStepIndex(Math.max(0, draft.step));
      setRestored(true);
    }
  }, [draftKey, reset]);

  useEffect(() => {
    if (!draftKey) return;
    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem(
          DRAFT_PREFIX + draftKey,
          JSON.stringify({ values, step: stepIndex }),
        );
      } catch {
        /* storage full or disabled — drafts are best effort */
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [draftKey, values, stepIndex]);

  const clearDraft = () => {
    if (draftKey) sessionStorage.removeItem(DRAFT_PREFIX + draftKey);
  };

  /** First message per field name; nested (route/address/item rows) errors surface their first child. */
  const firstMessage = (node: unknown): string | undefined => {
    if (!node || typeof node !== "object") return undefined;
    const record = node as Record<string, unknown>;
    if (typeof record.message === "string" && record.message) return record.message;
    for (const [key, value] of Object.entries(record)) {
      if (key === "ref") continue;
      const nested = firstMessage(value);
      if (nested) return nested;
    }
    return undefined;
  };

  const collect = (errors: FieldErrors | null, names: string[]) =>
    names.flatMap((name) => {
      // After trigger(), formState.errors is still the last render's snapshot; getFieldState
      // reads the control's current state.
      const found = errors ? get(errors, name) : methods.getFieldState(name as never).error;
      const message = firstMessage(found);
      return message ? [{ name, message }] : [];
    });

  const showSummary = (items: Array<{ name: string; message: string }>) => {
    setSummary(items);
    requestAnimationFrame(() => summaryRef.current?.focus());
  };

  const goTo = (index: number) => {
    setSummary([]);
    setStepIndex(index);
    requestAnimationFrame(() =>
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const next = async () => {
    const names = step.fields.map(({ name }) => name);
    if (await trigger(names as never)) goTo(stepIndex + 1);
    else showSummary(collect(null, names));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) =>
    handleSubmit(
      async (parsed) => {
        setServerError(null);
        const result = await onSubmit(parsed);
        if (result && !result.ok) {
          for (const [name, message] of Object.entries(result.fieldErrors ?? {})) {
            methods.setError(name as never, { message });
          }
          setServerError(result.error ?? t("forms.submitFailed"));
          return;
        }
        clearDraft();
      },
      (errors) => {
        // Jump to the first step with an error (e.g. a rule on an earlier section).
        const firstBad = steps.findIndex(
          (s) =>
            collect(
              errors,
              s.fields.map(({ name }) => name),
            ).length > 0,
        );
        if (firstBad >= 0 && firstBad !== stepIndex) setStepIndex(firstBad);
        const target = steps[firstBad >= 0 ? firstBad : stepIndex]!;
        showSummary(
          collect(
            errors,
            target.fields.map(({ name }) => name),
          ),
        );
      },
    )(event);

  // Review shows parsed values (numbers, normalised phones) when the details are valid.
  const reviewParse = step.review
    ? buildDetailsSchema(schema, { mode: "client", presets }).safeParse(values.details ?? {})
    : null;
  const reviewDetails = reviewParse?.success ? (reviewParse.data as Record<string, unknown>) : null;

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={isLast ? submit : (event) => (event.preventDefault(), void next())}
        noValidate
        className="flex flex-col gap-6"
      >
        <div ref={topRef} className="flex scroll-mt-20 flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground">
              {t("forms.progress", {
                current: toLocaleDigits(stepIndex + 1, locale),
                total: toLocaleDigits(steps.length, locale),
              })}
            </span>
            <span className="text-muted-foreground">{step.title}</span>
          </div>
          <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {restored && (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary px-3 py-2 text-sm"
          >
            {t("forms.draftRestored")}
            <Button
              type="button"
              variant="link"
              className="h-auto px-0"
              onClick={() => {
                clearDraft();
                reset(initial);
                setRestored(false);
                goTo(0);
              }}
            >
              {t("forms.startOver")}
            </Button>
          </div>
        )}

        {stepIndex === 0 && schema.notice && (
          <p className="flex gap-2 rounded-lg border border-cta/40 bg-cta-tint px-3 py-2 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-cta" aria-hidden="true" />
            {tx(schema.notice)}
          </p>
        )}

        {summary.length > 0 && (
          <div
            ref={summaryRef}
            tabIndex={-1}
            role="alert"
            className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 outline-none"
          >
            <p className="font-semibold text-destructive">{t("forms.fixFirst")}</p>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {summary.map((item) => (
                <li key={item.name}>
                  <a href={`#${fieldId(item.name)}`} className="underline">
                    {labelFor(steps, item.name, locale)}
                  </a>
                  : {item.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <section aria-labelledby="step-title" className="flex flex-col gap-4">
          <div>
            <h2 id="step-title" className="text-xl font-bold">
              {step.title}
            </h2>
            {step.description && (
              <p className="text-sm text-muted-foreground">{step.description}</p>
            )}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {step.fields.map(({ field, name }) => (
              <FieldRenderer key={name} field={field} name={name} ctx={ctx} />
            ))}
          </div>
        </section>

        {step.review && (
          <section aria-labelledby="review-title" className="flex flex-col gap-3">
            <h2 id="review-title" className="text-lg font-bold">
              {t("forms.yourInfo")}
            </h2>
            <DetailsView
              schema={schema}
              details={reviewDetails ?? values.details ?? {}}
              areaNames={areaNames}
              locale={locale}
            />
          </section>
        )}

        {serverError && (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
          >
            {serverError}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          {stepIndex > 0 ? (
            <Button type="button" variant="outline" onClick={() => goTo(stepIndex - 1)}>
              <ArrowLeft className="size-5" aria-hidden="true" />
              {t("forms.back")}
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="submit"
            size="lg"
            disabled={formState.isSubmitting}
            className={isLast ? "bg-cta text-cta-foreground hover:bg-cta/90" : undefined}
          >
            {formState.isSubmitting && (
              <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            )}
            {isLast ? tx(schema.submitLabel) || t("forms.submit") : t("forms.next")}
            {!isLast && <ArrowRight className="size-5" aria-hidden="true" />}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

function labelFor(steps: Step[], name: string, locale: "bn" | "en"): string {
  for (const step of steps) {
    const hit = step.fields.find((item) => item.name === name);
    if (hit) return tr(hit.field.label, locale);
  }
  return name;
}
