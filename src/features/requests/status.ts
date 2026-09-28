import type { RequestPriority, RequestStatus } from "@/generated/prisma/enums";

/** Users may cancel only before work starts (docs/04 P7). */
export const CANCELLABLE: readonly RequestStatus[] = ["NEW", "REVIEWING"];

export const canCancel = (status: RequestStatus) => CANCELLABLE.includes(status);

/** "My requests" filter chips. */
export const REQUEST_FILTERS = {
  all: { label: "সব", statuses: null },
  active: { label: "চলমান", statuses: ["NEW", "REVIEWING", "PROCESSING"] },
  done: { label: "সম্পন্ন", statuses: ["COMPLETED"] },
  closed: { label: "বাতিল", statuses: ["CANCELLED", "REJECTED"] },
} as const satisfies Record<string, { label: string; statuses: readonly RequestStatus[] | null }>;

export type RequestFilter = keyof typeof REQUEST_FILTERS;

export function parseRequestFilter(value: unknown): RequestFilter {
  return typeof value === "string" && Object.hasOwn(REQUEST_FILTERS, value)
    ? (value as RequestFilter)
    : "all";
}

/**
 * Priority from the service and the `urgency` answer (URGENCY_OPTIONS, medicine delivery): the
 * ambulance (isEmergency) and `emergency` are EMERGENCY; same-day answers are HIGH.
 */
export function requestPriority(
  isEmergencyService: boolean,
  details: Record<string, unknown>,
): RequestPriority {
  const urgency = details.urgency;
  if (isEmergencyService || urgency === "emergency") return "EMERGENCY";
  if (urgency === "today" || urgency === "within_1h") return "HIGH";
  return "NORMAL";
}
