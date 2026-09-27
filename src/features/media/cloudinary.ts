import "server-only";

import { v2 as cloudinary } from "cloudinary";

import { env } from "@/env";

import { TEMP_TAG } from "./config";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface StoredImage {
  publicId: string;
  resourceType: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  secureUrl: string;
  createdAt: Date;
  tags: string[];
}

/** Signs exactly the parameters the browser will send to Cloudinary's upload API. */
export function signUpload(params: Record<string, string | number>): string {
  return cloudinary.utils.api_sign_request(params, env.CLOUDINARY_API_SECRET);
}

export const cloudName = () => env.CLOUDINARY_CLOUD_NAME;
export const apiKey = () => env.CLOUDINARY_API_KEY;

const isNotFound = (error: unknown) =>
  !!error &&
  typeof error === "object" &&
  "error" in error &&
  (error as { error?: { http_code?: number } }).error?.http_code === 404;

/** What Cloudinary actually stored (Admin API) — the authoritative check for registerMedia. */
export async function getStoredImage(publicId: string): Promise<StoredImage | null> {
  try {
    const resource = await cloudinary.api.resource(publicId, { resource_type: "image" });
    return {
      publicId: resource.public_id,
      resourceType: resource.resource_type,
      format: resource.format,
      bytes: resource.bytes,
      width: resource.width,
      height: resource.height,
      secureUrl: resource.secure_url,
      createdAt: new Date(resource.created_at),
      tags: resource.tags ?? [],
    };
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

/** Deletes images (and their derivatives), 100 per Admin API call. */
export async function destroyImages(publicIds: string[]): Promise<void> {
  for (let i = 0; i < publicIds.length; i += 100) {
    await cloudinary.api.delete_resources(publicIds.slice(i, i + 100), { resource_type: "image" });
  }
}

/** Called after an asset is attached, so the cleanup cron no longer sees it. */
export async function removeTempTag(publicIds: string[]): Promise<void> {
  for (let i = 0; i < publicIds.length; i += 1000) {
    await cloudinary.uploader.remove_tag(TEMP_TAG, publicIds.slice(i, i + 1000));
  }
}

/**
 * Images still tagged `temp`, created before `cutoff`, under `prefix` (this environment only —
 * environments may share one Cloudinary account). Paginated.
 */
export async function listTempImagesBefore(cutoff: Date, prefix: string): Promise<string[]> {
  const found: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await cloudinary.api.resources_by_tag(TEMP_TAG, {
      resource_type: "image",
      max_results: 500,
      ...(cursor ? { next_cursor: cursor } : {}),
    });
    for (const resource of page.resources) {
      if (resource.public_id.startsWith(prefix) && new Date(resource.created_at) < cutoff) {
        found.push(resource.public_id);
      }
    }
    cursor = page.next_cursor;
  } while (cursor);
  return found;
}
