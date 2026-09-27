import "server-only";

import { db } from "@/lib/db";

/**
 * D-03: guest requests auto-link to an account once that phone is OTP-verified (sign-up, login,
 * or a Google user adding their phone). `isGuest` stays true for analytics.
 */
export async function linkGuestRequests(userId: string, phoneNumber: string): Promise<number> {
  const { count } = await db.serviceRequest.updateMany({
    where: { userId: null, contactPhone: phoneNumber },
    data: { userId },
  });
  return count;
}
