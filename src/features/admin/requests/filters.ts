// Admin request list filters ⇄ URL search params. The same object drives the list, the CSV export
// and the saved views, so a shared link reproduces exactly what the operator saw.
import { z } from "zod";

import { RequestPriority, RequestSource, RequestStatus } from "@/generated/prisma/enums";

const id = z.string().trim().min(1).max(64);
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const requestFiltersSchema = z.object({
  status: z.enum(RequestStatus).optional(),
  priority: z.enum(RequestPriority).optional(),
  source: z.enum(RequestSource).optional(),
  category: id.optional(), // category slug
  service: id.optional(), // service slug
  area: id.optional(), // area id (upazila or sub-area)
  /** "me" | "none" | a user id */
  assignee: id.optional(),
  /** "guest" | "user" */
  who: z.enum(["guest", "user"]).optional(),
  /** Spam is hidden unless asked for: "only" shows only spam, "all" shows everything. */
  spam: z.enum(["only", "all"]).optional(),
  from: ymd.optional(), // Dhaka calendar dates, inclusive
  to: ymd.optional(),
  q: z.string().trim().min(1).max(40).optional(), // request code or phone
  page: z.coerce.number().int().min(1).max(10_000).optional(),
});

export type RequestFilters = z.infer<typeof requestFiltersSchema>;
export const FILTER_KEYS = Object.keys(requestFiltersSchema.shape) as Array<keyof RequestFilters>;

/** Search params → filters. Invalid values are dropped one by one (a bad link still works). */
export function parseRequestFilters(
  params: Record<string, string | string[] | undefined>,
): RequestFilters {
  const filters: Record<string, unknown> = {};
  for (const key of FILTER_KEYS) {
    const raw = params[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value === undefined || value === "") continue;
    const parsed = requestFiltersSchema.shape[key].safeParse(value);
    if (parsed.success && parsed.data !== undefined) filters[key] = parsed.data;
  }
  return filters as RequestFilters;
}

/** Filters → query string (stable key order, no page 1, no empties). */
export function serializeRequestFilters(filters: RequestFilters): string {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = filters[key];
    if (value === undefined || value === "" || (key === "page" && value === 1)) continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** One-click saved views (docs/04 P8 "saved New view"). */
export const SAVED_VIEWS = {
  new: { status: "NEW" },
  emergency: { priority: "EMERGENCY" },
  mine: { assignee: "me" },
  spam: { spam: "only" },
  all: {},
} as const satisfies Record<string, RequestFilters>;

export type SavedView = keyof typeof SAVED_VIEWS;

/** Which saved view (if any) the filters exactly match. */
export function activeView(filters: RequestFilters): SavedView | null {
  const { page: _page, ...rest } = filters;
  const current = JSON.stringify(Object.entries(rest).sort());
  for (const [name, view] of Object.entries(SAVED_VIEWS)) {
    if (JSON.stringify(Object.entries(view).sort()) === current) return name as SavedView;
  }
  return null;
}
