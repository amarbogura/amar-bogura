import { createHmac } from "node:crypto";

/** Client IP behind Vercel's proxy. Falls back to a constant so limits still apply per-bucket. */
export function getClientIp(headers: Headers): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}

/** Keyed hash so AuditLog/SearchLog never store raw IPs. */
export function hashIp(ip: string, secret: string): string {
  return createHmac("sha256", secret).update(ip).digest("hex").slice(0, 32);
}
