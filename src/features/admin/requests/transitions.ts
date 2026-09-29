// ServiceRequest status machine (docs/02 §5). One place decides every allowed move.
import type { RequestStatus } from "@/generated/prisma/enums";

export type TransitionActor = "admin" | "user";

export const OPEN_STATUSES: readonly RequestStatus[] = ["NEW", "REVIEWING", "PROCESSING"];
export const CLOSED_STATUSES: readonly RequestStatus[] = ["COMPLETED", "REJECTED", "CANCELLED"];

const ADMIN_MOVES: Record<RequestStatus, readonly RequestStatus[]> = {
  NEW: ["REVIEWING", "REJECTED", "CANCELLED"],
  REVIEWING: ["PROCESSING", "REJECTED", "CANCELLED"],
  PROCESSING: ["COMPLETED", "REJECTED"],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

const USER_MOVES: Record<RequestStatus, readonly RequestStatus[]> = {
  NEW: ["CANCELLED"],
  REVIEWING: ["CANCELLED"],
  PROCESSING: [],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

/** Statuses `actor` may move a request to from `from` (closed requests never reopen in the MVP). */
export function allowedNext(from: RequestStatus, actor: TransitionActor): readonly RequestStatus[] {
  return (actor === "admin" ? ADMIN_MOVES : USER_MOVES)[from];
}

export function canTransition(
  from: RequestStatus,
  to: RequestStatus,
  actor: TransitionActor,
): boolean {
  return allowedNext(from, actor).includes(to);
}

/**
 * The customer must be told why: rejecting, and an admin cancelling on the customer's behalf,
 * need a customer-visible message.
 */
export function requiresMessage(to: RequestStatus, actor: TransitionActor): boolean {
  return to === "REJECTED" || (to === "CANCELLED" && actor === "admin");
}

export const isClosed = (status: RequestStatus) => CLOSED_STATUSES.includes(status);
