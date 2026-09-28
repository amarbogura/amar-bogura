"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import type { AreaGroup } from "@/features/account/queries";
import { toServerPayload, type RequestFormValues } from "@/features/forms/build-zod";
import { DynamicForm, type SubmitResult } from "@/features/forms/components/dynamic-form";
import type { FormSchema, ServiceFormPresets } from "@/features/forms/types";
import { routes } from "@/lib/routes";

import { type SubmitRequestInput, submitServiceRequest } from "../actions";
import { HONEYPOT_FIELD } from "../honeypot";
import { type TurnstileHandle, TurnstileWidget } from "./turnstile-widget";

const TOKEN_WAIT_MS = 8000;

/**
 * The request page's form: P6 DynamicForm + the D-03 guest guards (honeypot, Turnstile) wired to
 * `submitServiceRequest`. Success → `/request/success/[code]`.
 */
export function RequestForm({
  target,
  schema,
  presets,
  areaGroups,
  defaultValues,
  draftKey,
  guest,
  turnstileSiteKey,
}: {
  target: SubmitRequestInput["target"];
  schema: FormSchema;
  presets: ServiceFormPresets;
  areaGroups: AreaGroup[];
  defaultValues: RequestFormValues;
  draftKey: string;
  guest: boolean;
  turnstileSiteKey: string;
}) {
  const router = useRouter();
  const honeypot = useRef<HTMLInputElement>(null);
  const turnstile = useRef<TurnstileHandle | null>(null);
  // A ref, not state: the latest token must be read at submit time, whatever render built the handler.
  const token = useRef<string | undefined>(undefined);
  const [needPhone, setNeedPhone] = useState(false);
  const onToken = useCallback((value: string | undefined) => {
    token.current = value;
  }, []);

  /** Cloudflare issues the token a few seconds after load; a very fast submit waits for it. */
  async function waitForToken(): Promise<string | undefined> {
    const deadline = Date.now() + TOKEN_WAIT_MS;
    for (;;) {
      const current = turnstile.current?.getToken() ?? token.current;
      if (current || Date.now() > deadline) return current;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  async function submit(values: RequestFormValues): Promise<SubmitResult> {
    const result = await submitServiceRequest({
      target,
      payload: toServerPayload(schema, values),
      turnstileToken: guest ? await waitForToken() : undefined,
      [HONEYPOT_FIELD]: honeypot.current?.value || undefined,
    });
    if (result.ok) {
      router.push(routes.requestSuccess(result.code));
      return { ok: true };
    }
    turnstile.current?.reset();
    if (result.needPhone) setNeedPhone(true);
    return { ok: false, error: result.error, fieldErrors: result.fieldErrors };
  }

  return (
    <div className="flex flex-col gap-4">
      {needPhone && (
        <p className="rounded-lg border border-cta/30 bg-cta-tint p-3 text-sm">
          রিকোয়েস্ট দেওয়ার আগে মোবাইল নম্বর যাচাই করতে হবে।{" "}
          <Link
            className="font-semibold underline"
            href={`/account/verify-phone?next=${encodeURIComponent(window.location.pathname)}`}
          >
            এখনই যাচাই করুন
          </Link>
        </p>
      )}
      <DynamicForm
        schema={schema}
        presets={presets}
        areaGroups={areaGroups}
        defaultValues={defaultValues}
        draftKey={draftKey}
        onSubmit={submit}
      />
      {/* Honeypot: invisible to people and screen readers; bots fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input
            ref={honeypot}
            name={HONEYPOT_FIELD}
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>
      {guest && (
        <TurnstileWidget siteKey={turnstileSiteKey} onToken={onToken} handleRef={turnstile} />
      )}
    </div>
  );
}
