"use client";

import { useState } from "react";

import type { AreaGroup } from "@/features/account/queries";

import { toServerPayload } from "../build-zod";
import { commonFields } from "../common-fields";
import { devValidateSubmission, type DevValidationResult } from "../dev-actions";
import type { FormSchema, ServiceFormPresets } from "../types";
import { DetailsView } from "./details-view";
import { DynamicForm } from "./dynamic-form";
import { areaNameMap } from "./render-context";

export interface PlaygroundService {
  slug: string;
  nameBn: string;
  presets: ServiceFormPresets;
}

/** /dev/forms/[key]: render a template with any service's presets and inspect the server output. */
export function FormPlayground({
  templateKey,
  schema,
  services,
  areaGroups,
}: {
  templateKey: string;
  schema: FormSchema;
  services: PlaygroundService[];
  areaGroups: AreaGroup[];
}) {
  const [serviceSlug, setServiceSlug] = useState(services[0]?.slug ?? "");
  const [result, setResult] = useState<DevValidationResult | null>(null);
  const service = services.find((item) => item.slug === serviceSlug);

  return (
    <div className="flex flex-col gap-6">
      {services.length > 0 && (
        <label className="flex flex-col gap-1 text-sm font-medium">
          সার্ভিস (presets)
          <select
            className="h-11 rounded-md border px-3"
            value={serviceSlug}
            onChange={(event) => {
              setServiceSlug(event.target.value);
              setResult(null);
            }}
          >
            <option value="">— কোনো সার্ভিস না (presets ছাড়া) —</option>
            {services.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.nameBn} {Object.keys(item.presets.pinned ?? {}).length ? "📌" : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <DynamicForm
        key={serviceSlug}
        schema={schema}
        presets={service?.presets}
        areaGroups={areaGroups}
        draftKey={`dev:${templateKey}:${serviceSlug}`}
        onSubmit={async (values) => {
          const payload = toServerPayload(schema, values);
          const response = await devValidateSubmission({
            templateKey,
            serviceSlug: serviceSlug || undefined,
            payload,
          });
          setResult(response);
          return response.ok
            ? { ok: true }
            : { ok: false, error: "সার্ভার যাচাইয়ে সমস্যা — নিচে দেখুন।" };
        }}
      />

      {result && (
        <section
          aria-labelledby="server-result"
          className="flex flex-col gap-3 rounded-xl border-2 border-dashed p-4"
        >
          <h2 id="server-result" className="font-bold" data-testid="server-result">
            সার্ভার যাচাই: {result.ok ? "✅ সফল" : "❌ ব্যর্থ"}
          </h2>
          {result.summary && <p data-testid="summary">সারাংশ: {result.summary}</p>}
          {result.data && (
            <DetailsView
              schema={schema}
              details={result.data.details}
              extraFields={commonFields(schema)}
              extraValues={result.data.common}
              areaNames={areaNameMap(areaGroups)}
            />
          )}
          <pre
            data-testid="server-json"
            className="max-h-80 overflow-auto rounded bg-muted p-3 text-xs"
          >
            {JSON.stringify(result.ok ? result.data : result.issues, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
