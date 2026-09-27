"use server";

import { z } from "zod";

import { env } from "@/env";
import { MediaPurpose } from "@/generated/prisma/enums";
import { type ActionResult, fail, ok } from "@/lib/action";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

import { destroyImages, getStoredImage } from "./cloudinary";
import { isAllowedFormat, MAX_BYTES, ownsPublicId, uploaderKey } from "./config";
import { resolveUploader } from "./uploader";

const registerSchema = z.object({
  publicId: z.string().min(1).max(300),
  purpose: z.enum(MediaPurpose),
});

export interface RegisteredMedia {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
}

/**
 * Records a finished Cloudinary upload as a TEMP MediaAsset after verifying — against Cloudinary
 * itself, never the client — that it belongs to the caller, is an allowed image type and ≤ 5 MB.
 * Anything invalid is deleted from Cloudinary. Idempotent per publicId.
 */
export async function registerMedia(input: {
  publicId: string;
  purpose: MediaPurpose;
}): Promise<ActionResult<RegisteredMedia>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return fail(400);
  const { publicId, purpose } = parsed.data;

  const resolved = await resolveUploader(purpose);
  if (!resolved.ok) return fail(resolved.status, resolved.error);
  const { uploader } = resolved;

  // Ownership before any Cloudinary call: nobody can probe or register another uploader's asset.
  if (!ownsPublicId(publicId, purpose, env.NODE_ENV, uploader)) return fail(403);
  if (!(await rateLimit("mediaRegister", uploaderKey(uploader))).success) return fail(429);

  const existing = await db.mediaAsset.findUnique({
    where: { publicId },
    select: { id: true, url: true, width: true, height: true },
  });
  if (existing) return ok(existing);

  const stored = await getStoredImage(publicId);
  if (!stored) return fail(404, "ছবিটি খুঁজে পাওয়া যায়নি। আবার আপলোড করুন।");

  if (stored.resourceType !== "image" || !isAllowedFormat(stored.format)) {
    await destroyImages([publicId]);
    return fail(400, "শুধু JPG, PNG, WEBP বা HEIC ছবি দেওয়া যাবে।");
  }
  if (stored.bytes > MAX_BYTES) {
    await destroyImages([publicId]);
    return fail(400, "প্রতিটি ছবি সর্বোচ্চ ৫ MB হতে পারে।");
  }

  const media = await db.mediaAsset.create({
    data: {
      publicId,
      url: stored.secureUrl,
      width: stored.width,
      height: stored.height,
      bytes: stored.bytes,
      format: stored.format,
      purpose,
      status: "TEMP",
      uploadedById: uploader.kind === "user" ? uploader.id : null,
      guestKey: uploader.kind === "guest" ? uploader.key : null,
    },
    select: { id: true, url: true, width: true, height: true },
  });
  return ok(media);
}
