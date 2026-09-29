import "server-only";

import type { FormSchema } from "@/features/forms/types";
import { normalizeRequestCode } from "@/features/requests/code";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { normalizeBdPhone } from "@/lib/phone";
import { startOfDhakaDay } from "@/lib/time";

import type { RequestFilters } from "./filters";
import { OPEN_STATUSES } from "./transitions";

export const ADMIN_PAGE_SIZE = 25;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Start of a Dhaka calendar date (`YYYY-MM-DD`) as a UTC instant. */
export const dhakaDateStart = (ymd: string) => startOfDhakaDay(new Date(`${ymd}T12:00:00+06:00`));

/** Filters → Prisma where. `me` is the current admin (for assignee = "me"). */
export function requestWhere(filters: RequestFilters, me: string): Prisma.ServiceRequestWhereInput {
  const and: Prisma.ServiceRequestWhereInput[] = [];
  if (filters.status) and.push({ status: filters.status });
  if (filters.priority) and.push({ priority: filters.priority });
  if (filters.source) and.push({ source: filters.source });
  if (filters.category) and.push({ category: { slug: filters.category } });
  if (filters.service) and.push({ service: { slug: filters.service } });
  if (filters.area)
    and.push({ OR: [{ areaId: filters.area }, { area: { parentId: filters.area } }] });
  if (filters.assignee === "me") and.push({ assignedToId: me });
  else if (filters.assignee === "none") and.push({ assignedToId: null });
  else if (filters.assignee) and.push({ assignedToId: filters.assignee });
  if (filters.who === "guest") and.push({ isGuest: true });
  if (filters.who === "user") and.push({ isGuest: false });
  if (filters.spam === "only") and.push({ isSpam: true });
  else if (filters.spam !== "all") and.push({ isSpam: false });
  if (filters.from) and.push({ createdAt: { gte: dhakaDateStart(filters.from) } });
  if (filters.to)
    and.push({ createdAt: { lt: new Date(dhakaDateStart(filters.to).getTime() + DAY_MS) } });
  if (filters.q) {
    const code = normalizeRequestCode(filters.q);
    const phone = normalizeBdPhone(filters.q);
    if (code) and.push({ code });
    else if (phone) and.push({ OR: [{ contactPhone: phone }, { altPhone: phone }] });
    else and.push({ code: { contains: filters.q.toUpperCase() } });
  }
  return and.length ? { AND: and } : {};
}

const listSelect = {
  id: true,
  code: true,
  type: true,
  status: true,
  priority: true,
  source: true,
  isGuest: true,
  isSpam: true,
  title: true,
  contactName: true,
  contactPhone: true,
  createdAt: true,
  service: { select: { nameBn: true, nameEn: true } },
  area: { select: { nameBn: true, nameEn: true } },
  assignedTo: { select: { id: true, name: true } },
} satisfies Prisma.ServiceRequestSelect;

export type AdminRequestRow = Prisma.ServiceRequestGetPayload<{ select: typeof listSelect }>;

/**
 * One page of requests. Open EMERGENCY requests are pinned first (ambulance calls must never sit
 * under a page of routine work), then newest first.
 */
export async function listAdminRequests(
  filters: RequestFilters,
  me: string,
): Promise<{ rows: AdminRequestRow[]; total: number; page: number; pages: number }> {
  const where = requestWhere(filters, me);
  const page = filters.page ?? 1;
  const total = await db.serviceRequest.count({ where });
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const pinnedFilter: Prisma.ServiceRequestWhereInput = {
    priority: "EMERGENCY",
    status: { in: [...OPEN_STATUSES] },
  };
  // Page 1 starts with every pinned row; later pages continue the unpinned list after them.
  const [pinnedCount, pinned] = await Promise.all([
    db.serviceRequest.count({ where: { AND: [where, pinnedFilter] } }),
    page === 1
      ? db.serviceRequest.findMany({
          where: { AND: [where, pinnedFilter] },
          orderBy: { createdAt: "desc" },
          select: listSelect,
        })
      : Promise.resolve([]),
  ]);
  const skip = Math.max(0, (page - 1) * ADMIN_PAGE_SIZE - (page === 1 ? 0 : pinnedCount));
  const rest = await db.serviceRequest.findMany({
    where: { AND: [where, { NOT: pinnedFilter }] },
    orderBy: { createdAt: "desc" },
    skip,
    take: Math.max(0, ADMIN_PAGE_SIZE - pinned.length),
    select: listSelect,
  });
  return { rows: [...pinned, ...rest], total, page, pages };
}

export async function countNewRequests(): Promise<number> {
  return db.serviceRequest.count({ where: { status: "NEW", isSpam: false } });
}

const detailSelect = {
  ...listSelect,
  userId: true,
  locale: true,
  altPhone: true,
  areaId: true,
  addressLine: true,
  preferredDate: true,
  preferredTimeSlot: true,
  notes: true,
  details: true,
  quotedAmount: true,
  adminTags: true,
  ipHash: true,
  closedAt: true,
  updatedAt: true,
  category: { select: { slug: true, nameBn: true, nameEn: true } },
  service: { select: { slug: true, nameBn: true, nameEn: true } },
  user: { select: { id: true, name: true, phoneNumber: true } },
  formVersion: { select: { schema: true, version: true } },
  attachments: { select: { fieldKey: true, media: { select: { id: true, url: true } } } },
  events: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      type: true,
      fromStatus: true,
      toStatus: true,
      message: true,
      visibleToUser: true,
      createdAt: true,
      actor: { select: { name: true } },
    },
  },
} satisfies Prisma.ServiceRequestSelect;

export type AdminRequestDetail = Omit<
  Prisma.ServiceRequestGetPayload<{ select: typeof detailSelect }>,
  "formVersion"
> & { schema: FormSchema | null; formVersion: number | null; phoneBlocked: boolean };

export async function getAdminRequest(code: string): Promise<AdminRequestDetail | null> {
  const row = await db.serviceRequest.findUnique({ where: { code }, select: detailSelect });
  if (!row) return null;
  const blocked = await db.blockedPhone.count({ where: { phone: row.contactPhone } });
  const { formVersion, ...rest } = row;
  return {
    ...rest,
    schema: (formVersion?.schema as FormSchema | undefined) ?? null,
    formVersion: formVersion?.version ?? null,
    phoneBlocked: blocked > 0,
  };
}

/** Admins who can be assigned requests (they must hold `requests.manage`: every admin role). */
export async function listAssignableAdmins(): Promise<Array<{ id: string; name: string }>> {
  return db.user.findMany({
    where: { role: { in: ["operator", "admin", "super_admin"] }, banned: false },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

/** Options for the filter dropdowns. */
export async function getFilterOptions() {
  const [categories, services] = await Promise.all([
    db.category.findMany({
      where: { kind: { in: ["SERVICE", "CUSTOM_REQUEST"] } },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, nameBn: true, nameEn: true },
    }),
    db.service.findMany({
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      select: { slug: true, nameBn: true, nameEn: true, category: { select: { slug: true } } },
    }),
  ]);
  return { categories, services };
}
