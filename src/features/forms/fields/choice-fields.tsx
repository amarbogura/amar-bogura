"use client";

import { useFormContext } from "react-hook-form";

import { cn } from "@/lib/utils";

import { fieldId } from "../components/render-context";
import { bn } from "../schema-utils";
import type { FormField } from "../types";
import { describedBy, FieldShell, useFieldError } from "./field-shell";

export const selectClass =
  "h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive";

const optionCard =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border bg-background px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-tint has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50";

export function SelectField({ field, name }: { field: FormField; name: string }) {
  const { register } = useFormContext();
  const id = fieldId(name);
  const error = useFieldError(name);
  return (
    <FieldShell field={field} name={name}>
      <select
        id={id}
        className={selectClass}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy(id, !!field.help, !!error)}
        aria-required={field.required || undefined}
        defaultValue=""
        {...register(name)}
      >
        <option value="">বেছে নিন</option>
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {bn(option.label)}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function RadioField({ field, name }: { field: FormField; name: string }) {
  const { register } = useFormContext();
  const id = fieldId(name);
  const many = (field.options?.length ?? 0) > 3;
  return (
    <FieldShell field={field} name={name} group>
      <div id={id} className={cn("grid gap-2", many ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
        {field.options?.map((option) => (
          <label key={option.value} className={optionCard}>
            <input
              type="radio"
              value={option.value}
              className="size-4 accent-primary"
              {...register(name)}
            />
            {bn(option.label)}
          </label>
        ))}
      </div>
    </FieldShell>
  );
}

/** checkboxes and multiselect (a checkbox list is more usable on phones than a multi-select). */
export function CheckboxesField({ field, name }: { field: FormField; name: string }) {
  const { register } = useFormContext();
  const id = fieldId(name);
  return (
    <FieldShell field={field} name={name} group>
      <div id={id} className="grid gap-2 sm:grid-cols-2">
        {field.options?.map((option) => (
          <label key={option.value} className={optionCard}>
            <input
              type="checkbox"
              value={option.value}
              className="size-4 accent-primary"
              {...register(name)}
            />
            {bn(option.label)}
          </label>
        ))}
      </div>
    </FieldShell>
  );
}

export function BooleanField({ field, name }: { field: FormField; name: string }) {
  const { register } = useFormContext();
  const id = fieldId(name);
  const error = useFieldError(name);
  const width = field.width === "half" ? "sm:col-span-1" : "sm:col-span-2";
  return (
    <div className={cn("flex flex-col gap-1", width)}>
      <label htmlFor={id} className={cn(optionCard, "self-start")}>
        <input
          id={id}
          type="checkbox"
          className="size-4 accent-primary"
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy(id, !!field.help, !!error)}
          {...register(name)}
        />
        {bn(field.label)}
      </label>
      {field.help && (
        <p id={`${id}-help`} className="text-sm text-muted-foreground">
          {bn(field.help)}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
