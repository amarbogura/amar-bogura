// Client-side image shrinking before upload (saves mobile data; Cloudinary also stores a ≤1600px
// WebP derivative). Own ~40-line implementation instead of browser-image-compression, whose web
// worker loads a script from a CDN that our CSP blocks.
import { MAX_DIMENSION } from "./config";

/** Target size for an image, never upscaling. */
export function fitWithin(width: number, height: number, max = MAX_DIMENSION) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** Browsers can't decode HEIC/HEIF (and GIFs would lose animation) — upload those as-is. */
export function canCompress(type: string): boolean {
  return ["image/jpeg", "image/png", "image/webp"].includes(type);
}

export async function compressImage(file: File, quality = 0.82): Promise<File> {
  if (!canCompress(file.type) || typeof createImageBitmap !== "function") return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
  // Keep the original when the browser can't encode WebP or compression didn't help.
  if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;
  const name = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${name}.webp`, { type: "image/webp", lastModified: Date.now() });
}
