"use client";

import { get, useFormState } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { fieldId } from "../components/render-context";
import { bn } from "../schema-utils";
import type { FormField } from "../types";

/** First error message under a path (nested object errors surface their first child message). */
export function useFieldError(name: string): string | undefined {
  const { errors } = useFormState({ name });
  const error = get(errors, name) as unknown;
  const find = (node: unknown): string | undefined => {
    if (!node || typeof node !== "object") return undefined;
    const record = node as Record<string, unknown>;
    if (typeof record.message === "string" && record.message) return record.message;
    for (const value of Object.values(record)) {
      const nested =
        typeof value === "object" && value !== null && value !== record.ref
          ? find(value)
          : undefined;
      if (nested) return nested;
    }
    return undefined;
  };
  return find(error);
}

export const describedBy = (id: string, help: boolean, error: boolean) =>
  [help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

export function RequiredMark() {
  return (
    <>
      <span aria-hidden="true" className="text-destructive">
        {" *"}
      </span>
      <span className="sr-only"> (আবশ্যক)</span>
    </>
  );
}

/**
 * Label + help + error around one field. `group` renders a fieldset/legend (radio, checkbox,
 * composite fields) instead of a single <label>.
 */
export function FieldShell({
  field,
  name,
  group = false,
  showError = true,
  children,
}: {
  field: FormField;
  name: string;
  group?: boolean;
  showError?: boolean;
  children: React.ReactNode;
}) {
  const id = fieldId(name);
  const error = useFieldError(name);
  const help = bn(field.help);
  const width = field.width === "half" ? "sm:col-span-1" : "sm:col-span-2";
  const heading = (
    <>
      {bn(field.label)}
      {field.required && <RequiredMark />}
    </>
  );

  const body = (
    <>
      {help && (
        <p id={`${id}-help`} className="text-sm text-muted-foreground">
          {help}
        </p>
      )}
      {children}
      {showError && error && (
        <p id={`${id}-error`} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </>
  );

  if (group) {
    return (
      <fieldset
        className={cn("flex min-w-0 flex-col gap-2", width)}
        aria-describedby={describedBy(id, !!help, !!error)}
        aria-invalid={!!error || undefined}
      >
        <legend className="mb-1 text-sm font-medium">{heading}</legend>
        {body}
      </fieldset>
    );
  }
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", width)}>
      <Label htmlFor={id}>{heading}</Label>
      {body}
    </div>
  );
}
