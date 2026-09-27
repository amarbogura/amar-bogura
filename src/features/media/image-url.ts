// Delivery URLs for stored Cloudinary images (f_auto,q_auto — docs/01 §4). Works from the stored
// `secure_url`, so no cloud name is needed on the client.
const UPLOAD_SEGMENT = "/image/upload/";

export interface ImageTransform {
  width?: number;
  height?: number;
  crop?: "limit" | "fill" | "fit" | "thumb";
  quality?: number | "auto";
}

export function cloudinaryUrl(secureUrl: string, transform: ImageTransform = {}): string {
  const index = secureUrl.indexOf(UPLOAD_SEGMENT);
  if (!secureUrl.startsWith("https://res.cloudinary.com/") || index === -1) return secureUrl;
  const parts = [
    "f_auto",
    `q_${transform.quality ?? "auto"}`,
    `c_${transform.crop ?? "limit"}`,
    ...(transform.width ? [`w_${Math.round(transform.width)}`] : []),
    ...(transform.height ? [`h_${Math.round(transform.height)}`] : []),
  ];
  const start = index + UPLOAD_SEGMENT.length;
  return `${secureUrl.slice(0, start)}${parts.join(",")}/${secureUrl.slice(start)}`;
}

/** `next/image` loader: `<Image loader={cloudinaryLoader} src={media.url} … />`. */
export function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  return cloudinaryUrl(src, { width, quality: quality ?? "auto" });
}
