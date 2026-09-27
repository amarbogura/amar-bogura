"use client";

import { Info, Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUploader } from "@/features/media/components/image-uploader";
import { toBanglaDigits } from "@/lib/bangla";
import { cn } from "@/lib/utils";

import { fieldId, type RenderContext } from "../components/render-context";
import { addDays, dhakaToday } from "../date-utils";
import { UNIT_LABELS } from "../format-value";
import { bn } from "../schema-utils";
import { type FormField, IMAGES_MAX_FILES } from "../types";
import { AreaPicker } from "./area-picker";
import { selectClass } from "./choice-fields";
import { describedBy, FieldShell, RequiredMark, useFieldError } from "./field-shell";

type Props = { field: FormField; name: string; ctx: RenderContext };

function SubError({ name }: { name: string }) {
  const error = useFieldError(name);
  return error ? <p className="text-sm font-medium text-destructive">{error}</p> : null;
}

// ───────── date / time ─────────

export function DateField({ field, name }: Props) {
  const { register } = useFormContext();
  const id = fieldId(name);
  const error = useFieldError(name);
  const today = dhakaToday();
  return (
    <FieldShell field={field} name={name}>
      <Input
        id={id}
        type="date"
        min={addDays(today, field.validation?.min ?? 0)}
        max={field.validation?.max !== undefined ? addDays(today, field.validation.max) : undefined}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy(id, !!field.help, !!error)}
        aria-required={field.required || undefined}
        {...register(name)}
      />
    </FieldShell>
  );
}

export function TimeField({ field, name }: Props) {
  const { register } = useFormContext();
  const id = fieldId(name);
  const error = useFieldError(name);
  return (
    <FieldShell field={field} name={name}>
      <Input
        id={id}
        type="time"
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy(id, !!field.help, !!error)}
        {...register(name)}
      />
    </FieldShell>
  );
}

/** Stored as `YYYY-MM-DDTHH:mm` (Dhaka local); edited as a date + a time input. */
export function DateTimeField({ field, name }: Props) {
  const { control } = useFormContext();
  const id = fieldId(name);
  const error = useFieldError(name);
  return (
    <FieldShell field={field} name={name} group>
      <Controller
        control={control}
        name={name}
        render={({ field: rhf }) => {
          const [date = "", time = ""] = String(rhf.value ?? "").split("T");
          const set = (nextDate: string, nextTime: string) =>
            rhf.onChange(nextDate || nextTime ? `${nextDate}T${nextTime}` : "");
          return (
            <div className="grid grid-cols-2 gap-2">
              <Input
                id={id}
                type="date"
                aria-label="তারিখ"
                min={dhakaToday()}
                value={date}
                aria-invalid={!!error || undefined}
                onChange={(event) => set(event.target.value, time)}
                onBlur={rhf.onBlur}
              />
              <Input
                type="time"
                aria-label="সময়"
                value={time}
                aria-invalid={!!error || undefined}
                onChange={(event) => set(date, event.target.value)}
                onBlur={rhf.onBlur}
              />
            </div>
          );
        }}
      />
    </FieldShell>
  );
}

export function DateRangeField({ field, name }: Props) {
  const { register } = useFormContext();
  const id = fieldId(name);
  const min = addDays(dhakaToday(), field.validation?.min ?? 0);
  return (
    <FieldShell field={field} name={name} group>
      <div className="grid grid-cols-2 gap-2">
        <Input id={id} type="date" aria-label="শুরু" min={min} {...register(`${name}.from`)} />
        <Input type="date" aria-label="শেষ" min={min} {...register(`${name}.to`)} />
      </div>
    </FieldShell>
  );
}

// ───────── location ─────────

export function AreaField({ field, name, ctx }: Props) {
  const { control } = useFormContext();
  const id = fieldId(name);
  const error = useFieldError(name);
  return (
    <FieldShell field={field} name={name}>
      <Controller
        control={control}
        name={name}
        render={({ field: rhf }) => (
          <AreaPicker
            id={id}
            groups={ctx.areaGroups}
            value={rhf.value}
            onChange={rhf.onChange}
            invalid={!!error}
            describedBy={describedBy(id, !!field.help, !!error)}
          />
        )}
      />
    </FieldShell>
  );
}

export function AddressField({ field, name, ctx }: Props) {
  const { control, register } = useFormContext();
  const id = fieldId(name);
  return (
    <FieldShell field={field} name={name} group showError={false}>
      <Controller
        control={control}
        name={`${name}.areaId`}
        render={({ field: rhf }) => (
          <AreaPicker
            id={id}
            ariaLabel="উপজেলা / এলাকা"
            groups={ctx.areaGroups}
            value={rhf.value}
            onChange={rhf.onChange}
          />
        )}
      />
      <SubError name={`${name}.areaId`} />
      <Input
        aria-label="বাসা / রাস্তা / বিস্তারিত ঠিকানা"
        placeholder="বাসা নং, রাস্তা, মহল্লা"
        {...register(`${name}.line`)}
      />
      <SubError name={`${name}.line`} />
      <Input
        aria-label="চেনার সুবিধার জন্য কাছের জায়গা (ঐচ্ছিক)"
        placeholder="কাছের পরিচিত জায়গা (ঐচ্ছিক)"
        {...register(`${name}.landmark`)}
      />
      <SubError name={`${name}.landmark`} />
    </FieldShell>
  );
}

function RoutePoint({ name, title, ctx }: { name: string; title: string; ctx: RenderContext }) {
  const { control, register } = useFormContext();
  const id = fieldId(name);
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
      <p className="text-sm font-semibold">{title}</p>
      <Controller
        control={control}
        name={`${name}.areaId`}
        render={({ field: rhf }) => (
          <AreaPicker
            id={id}
            ariaLabel={`${title} — উপজেলা / এলাকা`}
            groups={ctx.areaGroups}
            value={rhf.value}
            onChange={rhf.onChange}
            allowOutside
          />
        )}
      />
      <Input
        aria-label={`${title} — ঠিকানা`}
        placeholder="ঠিকানা / জায়গার নাম"
        {...register(`${name}.address`)}
      />
      <SubError name={`${name}.address`} />
    </div>
  );
}

export function RouteField({ field, name, ctx }: Props) {
  return (
    <FieldShell field={field} name={name} group showError={false}>
      <RoutePoint name={`${name}.from`} title="কোথা থেকে" ctx={ctx} />
      <RoutePoint name={`${name}.to`} title="কোথায়" ctx={ctx} />
    </FieldShell>
  );
}

export function PersonField({ field, name }: Props) {
  const { register } = useFormContext();
  return (
    <FieldShell field={field} name={name} group showError={false}>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Input
            aria-label={`${bn(field.label)} — নাম`}
            placeholder="নাম"
            autoComplete="off"
            {...register(`${name}.name`)}
          />
          <SubError name={`${name}.name`} />
        </div>
        <div className="flex flex-col gap-1">
          <Input
            type="tel"
            inputMode="tel"
            aria-label={`${bn(field.label)} — মোবাইল`}
            placeholder="মোবাইল নম্বর"
            {...register(`${name}.phone`)}
          />
          <SubError name={`${name}.phone`} />
        </div>
      </div>
    </FieldShell>
  );
}

// ───────── item list (repeater) ─────────

export function ItemListField({ field, name }: Props) {
  const { control, register } = useFormContext();
  const { fields: rows, append, remove } = useFieldArray({ control, name });
  const units = field.validation?.units ?? ["piece"];
  const maxRows = field.validation?.max ?? 50;
  const blank = { name: "", qty: "", unit: units[0] };

  // Always offer one empty row to type into (blank rows are dropped on submit).
  useEffect(() => {
    if (rows.length === 0) append(blank, { shouldFocus: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the list becomes empty
  }, [rows.length]);

  return (
    <FieldShell field={field} name={name} group>
      <ol className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <li key={row.id} className="grid grid-cols-[1fr_4.5rem_6rem_auto] items-start gap-2">
            <Input
              aria-label={`পণ্য ${toBanglaDigits(index + 1)} — নাম`}
              placeholder="পণ্যের নাম"
              {...register(`${name}.${index}.name`)}
            />
            <Input
              aria-label={`পণ্য ${toBanglaDigits(index + 1)} — পরিমাণ`}
              placeholder="পরিমাণ"
              inputMode="decimal"
              {...register(`${name}.${index}.qty`)}
            />
            <select
              aria-label={`পণ্য ${toBanglaDigits(index + 1)} — একক`}
              className={selectClass}
              {...register(`${name}.${index}.unit`)}
            >
              {units.map((unit) => (
                <option key={unit} value={unit}>
                  {UNIT_LABELS[unit] ?? unit}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`পণ্য ${toBanglaDigits(index + 1)} সরান`}
              onClick={() => remove(index)}
              disabled={rows.length === 1}
            >
              <Trash2 className="size-5" aria-hidden="true" />
            </Button>
            <div className="col-span-4 empty:hidden">
              <SubError name={`${name}.${index}`} />
            </div>
          </li>
        ))}
      </ol>
      {rows.length < maxRows && (
        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => append(blank)}
        >
          <Plus className="size-5" aria-hidden="true" />
          আরেকটি যোগ করুন
        </Button>
      )}
    </FieldShell>
  );
}

// ───────── images / heading ─────────

export function ImagesField({ field, name, ctx }: Props) {
  const { control } = useFormContext();
  const id = fieldId(name);
  const error = useFieldError(name);
  const width = field.width === "half" ? "sm:col-span-1" : "sm:col-span-2";
  return (
    <div className={cn("flex flex-col gap-2", width)}>
      <Controller
        control={control}
        name={name}
        render={({ field: rhf }) => (
          <ImageUploader
            purpose={ctx.uploadPurpose}
            value={Array.isArray(rhf.value) ? rhf.value : []}
            onChange={rhf.onChange}
            max={Math.min(field.validation?.maxFiles ?? IMAGES_MAX_FILES, IMAGES_MAX_FILES)}
            label={bn(field.label)}
            describedBy={describedBy(id, !!field.help, !!error)}
          />
        )}
      />
      {field.required && (
        <span className="sr-only">
          <RequiredMark />
        </span>
      )}
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

export function HeadingField({ field }: { field: FormField }) {
  return (
    <p className="flex gap-2 rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground sm:col-span-2">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {bn(field.label)}
    </p>
  );
}
