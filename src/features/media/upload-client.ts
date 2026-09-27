// Browser side of the upload pipeline: sign → direct XHR upload (for progress) → registerMedia.
import type { MediaPurpose } from "@/generated/prisma/enums";

import { registerMedia, type RegisteredMedia } from "./actions";
import { ALLOWED_MIME_TYPES, MAX_BYTES } from "./config";

export class UploadError extends Error {}

const BANGLA = {
  type: "শুধু JPG, PNG, WEBP বা HEIC ছবি দেওয়া যাবে।",
  size: "প্রতিটি ছবি সর্বোচ্চ ৫ MB হতে পারে।",
  network: "ইন্টারনেট সমস্যার কারণে আপলোড হয়নি। আবার চেষ্টা করুন।",
  generic: "ছবি আপলোড করা যায়নি। আবার চেষ্টা করুন।",
};

/** Client type check before compressing (UX only — the server re-verifies everything). */
export function validateFileType(file: File): string | null {
  // Some Android galleries report HEIC with an empty type; accept by extension.
  const isHeicByName = /\.(heic|heif)$/i.test(file.name);
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type) && !isHeicByName) {
    return BANGLA.type;
  }
  return null;
}

/**
 * Size check on the file that will actually be uploaded — i.e. AFTER compression, so a 10 MB
 * camera JPEG that compresses to 1 MB is accepted. (The server's 5 MB check stays authoritative.)
 */
export function validateUploadSize(file: File): string | null {
  return file.size > MAX_BYTES ? BANGLA.size : null;
}

interface SignedParams {
  cloudName: string;
  apiKey: string;
  signature: string;
  allowed_formats: string;
  eager: string;
  public_id: string;
  tags: string;
  timestamp: number;
}

async function sign(purpose: MediaPurpose): Promise<SignedParams> {
  const response = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purpose }),
  });
  const body = (await response.json().catch(() => ({}))) as SignedParams & { error?: string };
  if (!response.ok) throw new UploadError(body.error ?? BANGLA.generic);
  return body;
}

function send(file: File, params: SignedParams, onProgress: (fraction: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", params.apiKey);
    form.append("signature", params.signature);
    for (const key of ["allowed_formats", "eager", "public_id", "tags", "timestamp"] as const) {
      form.append(key, String(params[key]));
    }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new UploadError(BANGLA.type));
    xhr.onerror = () => reject(new UploadError(BANGLA.network));
    xhr.send(form);
  });
}

export async function uploadImage(
  file: File,
  purpose: MediaPurpose,
  onProgress: (fraction: number) => void,
): Promise<RegisteredMedia> {
  const params = await sign(purpose);
  await send(file, params, onProgress);
  const result = await registerMedia({ publicId: params.public_id, purpose });
  if (!result.ok) throw new UploadError(result.error);
  return result.data;
}
