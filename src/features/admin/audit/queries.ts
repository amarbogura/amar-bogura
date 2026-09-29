import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

import { dhakaDateStart } from "../requests/queries";

export const AUDIT_PAGE_SIZE = 50;
const DAY_MS = 24 * 60 * 60 * 1000;
const YMD = /^\d{4}-\d{2}-\d{2}$/;

export interface AuditFilters {
  action?: string;
  entity?: string; // entity id (e.g. a request id, a phone)
  actor?: string; // actor user id
  from?: string;
  to?: string;
  page?: number;
}

export function parseAuditFilters(
  params: Record<string, string | string[] | undefined>,
): AuditFilters {
  const one = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, 80) || undefined;
  };
  const page = Number(one("page"));
  const from = one("from");
  const to = one("to");
  return {
    action: one("action"),
    entity: one("entity"),
    actor: one("actor"),
    from: from && YMD.test(from) ? from : undefined,
    to: to && YMD.test(to) ? to : undefined,
    page: Number.isInteger(page) && page > 1 ? Math.min(page, 10_000) : undefined,
  };
}

export async function listAuditLogs(filters: AuditFilters) {
  const and: Prisma.AuditLogWhereInput[] = [];
  if (filters.action) and.push({ action: { startsWith: filters.action } });
  if (filters.entity) and.push({ entityId: filters.entity });
  if (filters.actor) and.push({ actorId: filters.actor });
  if (filters.from) and.push({ createdAt: { gte: dhakaDateStart(filters.from) } });
  if (filters.to)
    and.push({ createdAt: { lt: new Date(dhakaDateStart(filters.to).getTime() + DAY_MS) } });
  const where: Prisma.AuditLogWhereInput = and.length ? { AND: and } : {};
  const page = filters.page ?? 1;
  const [total, rows] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        before: true,
        after: true,
        createdAt: true,
        actor: { select: { id: true, name: true } },
      },
    }),
  ]);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE)) };
}
