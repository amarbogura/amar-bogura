import "server-only";

import type { RequestType } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

export async function isBlockedPhone(phone: string): Promise<boolean> {
  return (await db.blockedPhone.count({ where: { phone } })) > 0;
}

/**
 * Same phone + same service (or custom) within 10 minutes → the existing request's code, so a
 * double tap or a retry after a slow network never creates two requests (docs/04 P7).
 */
export async function findDuplicateRequest(
  { phone, type, serviceId }: { phone: string; type: RequestType; serviceId: string | null },
  now: Date,
): Promise<string | null> {
  const existing = await db.serviceRequest.findFirst({
    where: {
      contactPhone: phone,
      type,
      serviceId,
      status: { not: "CANCELLED" },
      createdAt: { gte: new Date(now.getTime() - DUPLICATE_WINDOW_MS) },
    },
    orderBy: { createdAt: "desc" },
    select: { code: true },
  });
  return existing?.code ?? null;
}
