"use client";

import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { fieldId } from "../components/render-context";
import { bn } from "../schema-utils";
import type { FormField } from "../types";
import { describedBy, FieldShell, useFieldError } from "./field-shell";

const INPUT_PROPS: Partial<Record<FormField["type"], React.ComponentProps<"input">>> = {
  text: { type: "text", autoComplete: "off" },
  // Text + inputMode (not type=number) so Bangla digits and "1,200" are accepted and validated.
  number: { type: "text", inputMode: "decimal", autoComplete: "off" },
  money: { type: "text", inputMode: "numeric", autoComplete: "off" },
  phone: { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "০১৭XXXXXXXX" },
  url: { type: "url", inputMode: "url", autoComplete: "url", placeholder: "https://" },
};

/** text / number / money / phone / url. */
export function TextLikeField({ field, name }: { field: FormField; name: string }) {
  const { register } = useFormContext();
  const id = fieldId(name);
  const error = useFieldError(name);
  const input = (
    <Input
      id={id}
      {...INPUT_PROPS[field.type]}
      placeholder={bn(field.placeholder) || INPUT_PROPS[field.type]?.placeholder}
      maxLength={field.validation?.maxLength}
      aria-invalid={!!error || undefined}
      aria-describedby={describedBy(id, !!field.help, !!error)}
      aria-required={field.required || undefined}
      {...register(name)}
    />
  );
  return (
    <FieldShell field={field} name={name}>
      {field.type === "money" ? (
        <div className="relative">
          <span
            aria-hidden="true"
            className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          >
            ৳
          </span>
          <div className="[&_input]:pl-7">{input}</div>
        </div>
      ) : (
        input
      )}
    </FieldShell>
  );
}

export function TextareaField({ field, name }: { field: FormField; name: string }) {
  const { register } = useFormContext();
  const id = fieldId(name);
  const error = useFieldError(name);
  return (
    <FieldShell field={field} name={name}>
      <Textarea
        id={id}
        rows={4}
        placeholder={bn(field.placeholder)}
        maxLength={field.validation?.maxLength}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy(id, !!field.help, !!error)}
        aria-required={field.required || undefined}
        {...register(name)}
      />
    </FieldShell>
  );
}
