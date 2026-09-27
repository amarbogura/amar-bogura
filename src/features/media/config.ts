// Upload rules (docs/04 P5, D-10). Pure module: shared by the sign route, registerMedia, claimMedia
// and the client uploader, and unit-tested without Cloudinary.
import type { MediaPurpose } from "@/generated/prisma/enums";

export type UploaderPolicy = "user_or_guest" | "user" | "admin";

export const MEDIA_PURPOSES: Record<MediaPurpose, { uploader: UploaderPolicy; folder: string }> = {
  REQUEST: { uploader: "user_or_guest", folder: "requests" },
  LISTING: { uploader: "user", folder: "listings" },
  AVATAR: { uploader: "user", folder: "avatars" },
  CMS: { uploader: "admin", folder: "cms" },
};

export const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp", "heic", "heif"] as const;
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

/** 5 MB per image (D-10). Enforced client-side (UX) and server-side (registerMedia, authoritative). */
export const MAX_BYTES = 5 * 1024 * 1024;

/** Longest side after client compression and for the stored eager derivative. */
export const MAX_DIMENSION = 1600;

/** Eager derivative created at upload time: ≤1600px WebP. */
export const EAGER_TRANSFORMATION = `c_limit,w_${MAX_DIMENSION},h_${MAX_DIMENSION},q_auto/webp`;

/** Every upload starts tagged `temp`; claiming removes it; the daily cron deletes what remains. */
export const TEMP_TAG = "temp";

const ROOT = "amar-bogura";

export type Uploader = { kind: "user"; id: string } | { kind: "guest"; key: string };

/** Stable, path-safe key identifying the uploader inside the public_id. */
export function uploaderKey(uploader: Uploader): string {
  return uploader.kind === "user" ? `u_${uploader.id}` : `g_${uploader.key}`;
}

/** Root of everything this environment uploads (the cleanup cron only touches this prefix). */
export function environmentPrefix(env: string): string {
  return `${ROOT}/${env}/`;
}

export function mediaFolder(purpose: MediaPurpose, env: string): string {
  return `${ROOT}/${env}/${MEDIA_PURPOSES[purpose].folder}`;
}

/** `amar-bogura/{env}/{folder}/{uploaderKey}/{random}` — fixed by the server when signing. */
export function buildPublicId(
  purpose: MediaPurpose,
  env: string,
  uploader: Uploader,
  random: string,
): string {
  return `${mediaFolder(purpose, env)}/${uploaderKey(uploader)}/${random}`;
}

const SAFE_SEGMENT = /^[A-Za-z0-9_-]+$/;

/**
 * True only for public ids this uploader was allowed to create for this purpose. Rejects other
 * uploaders' ids, other purposes/environments and any path trickery ("..", extra segments).
 */
export function ownsPublicId(
  publicId: string,
  purpose: MediaPurpose,
  env: string,
  uploader: Uploader,
): boolean {
  const prefix = `${mediaFolder(purpose, env)}/${uploaderKey(uploader)}/`;
  if (!publicId.startsWith(prefix)) return false;
  const rest = publicId.slice(prefix.length);
  return SAFE_SEGMENT.test(rest);
}

export type UploadPermission = "ok" | "login_required" | "forbidden";

/** Who may upload for a purpose (admin check itself happens in the uploader resolver). */
export function uploadPermission(
  purpose: MediaPurpose,
  who: "guest" | "user" | "admin",
): UploadPermission {
  const policy = MEDIA_PURPOSES[purpose].uploader;
  if (policy === "user_or_guest") return "ok";
  if (who === "guest") return "login_required";
  if (policy === "admin" && who !== "admin") return "forbidden";
  return "ok";
}

export function isAllowedFormat(format: string | undefined): boolean {
  return !!format && (ALLOWED_FORMATS as readonly string[]).includes(format.toLowerCase());
}
