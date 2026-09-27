import { randomBytes } from "node:crypto";

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/env";
import { MediaPurpose } from "@/generated/prisma/enums";
import { apiKey, cloudName, signUpload } from "@/features/media/cloudinary";
import {
  ALLOWED_FORMATS,
  buildPublicId,
  EAGER_TRANSFORMATION,
  TEMP_TAG,
} from "@/features/media/config";
import { resolveUploader } from "@/features/media/uploader";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

const bodySchema = z.object({ purpose: z.enum(MediaPurpose) });

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Signed params for a direct browser → Cloudinary upload (docs/04 P5). The server fixes the
 * public_id (bound to the uploader), allowed formats, the `temp` tag and the eager derivative.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "অবৈধ অনুরোধ।" }, 400);
  const { purpose } = parsed.data;

  const resolved = await resolveUploader(purpose, { createGuest: true });
  if (!resolved.ok) return json({ error: resolved.error }, resolved.status);
  const { uploader } = resolved;

  const limits =
    uploader.kind === "user"
      ? [rateLimit("uploadSignUser", uploader.id)]
      : [
          rateLimit("uploadSignGuest", `ip:${getClientIp(await headers())}`),
          rateLimit("uploadSignGuest", `guest:${uploader.key}`),
        ];
  if ((await Promise.all(limits)).some((result) => !result.success)) {
    return json({ error: "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।" }, 429);
  }

  const params = {
    allowed_formats: ALLOWED_FORMATS.join(","),
    eager: EAGER_TRANSFORMATION,
    public_id: buildPublicId(
      purpose,
      env.NODE_ENV,
      uploader,
      randomBytes(12).toString("base64url"),
    ),
    tags: TEMP_TAG,
    timestamp: Math.floor(Date.now() / 1000),
  };

  return json({
    cloudName: cloudName(),
    apiKey: apiKey(),
    signature: signUpload(params),
    ...params,
  });
}
