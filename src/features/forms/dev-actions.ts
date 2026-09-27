"use server";

import { db } from "@/lib/db";

import { buildRequestFormSchema, type RequestFormValues } from "./build-zod";
import { summarize } from "./summarize";
import { getTemplate } from "./templates";
import type { ServiceFormPresets } from "./types";

export interface DevValidationResult {
  ok: boolean;
  data?: RequestFormValues;
  summary?: string;
  issues?: Array<{ path: string; message: string }>;
}

/**
 * /dev/forms only: re-validates a submitted payload in SERVER mode (exactly what P7's action does)
 * and reports the cleaned output. Refuses to run in production.
 */
export async function devValidateSubmission(input: {
  templateKey: string;
  serviceSlug?: string;
  payload: RequestFormValues;
}): Promise<DevValidationResult> {
  if (process.env.NODE_ENV === "production") throw new Error("Not available in production");
  const template = getTemplate(input.templateKey);
  if (!template) return { ok: false, issues: [{ path: "", message: "Unknown template" }] };

  let presets: ServiceFormPresets | undefined;
  if (input.serviceSlug) {
    const service = await db.service.findUnique({
      where: { slug: input.serviceSlug },
      select: { formPresets: true },
    });
    presets = (service?.formPresets ?? undefined) as ServiceFormPresets | undefined;
  }

  const result = buildRequestFormSchema(template.schema, { mode: "server", presets }).safeParse(
    input.payload,
  );
  if (!result.success) {
    return {
      ok: false,
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
  }
  const data = result.data as RequestFormValues;
  return { ok: true, data, summary: summarize(template.schema, data.details) };
}
