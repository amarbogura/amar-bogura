import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { isRole, type Role } from "@/lib/permissions";
import { normalizeBdPhone } from "@/lib/phone";

export const USERS_PAGE_SIZE = 25;

export interface UserFilters {
  q?: string;
  role?: Role;
  banned?: boolean;
  page?: number;
}

export function parseUserFilters(
  params: Record<string, string | string[] | undefined>,
): UserFilters {
  const one = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
  };
  const page = Number(one("page"));
  const role = one("role");
  return {
    q: one("q")?.slice(0, 60),
    role: isRole(role) ? role : undefined,
    banned: one("banned") === "1" ? true : undefined,
    page: Number.isInteger(page) && page > 1 ? Math.min(page, 10_000) : undefined,
  };
}

export async function listUsers(filters: UserFilters) {
  const and: Prisma.UserWhereInput[] = [];
  if (filters.role) and.push({ role: filters.role });
  if (filters.banned) and.push({ banned: true });
  if (filters.q) {
    const phone = normalizeBdPhone(filters.q);
    and.push({
      OR: [
        ...(phone ? [{ phoneNumber: phone }] : []),
        { name: { contains: filters.q, mode: "insensitive" } },
        { email: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }
  const where: Prisma.UserWhereInput = and.length ? { AND: and } : {};
  const page = filters.page ?? 1;
  const [total, rows] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * USERS_PAGE_SIZE,
      take: USERS_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        email: true,
        role: true,
        banned: true,
        createdAt: true,
      },
    }),
  ]);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / USERS_PAGE_SIZE)) };
}

export async function getUserDetail(id: string) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      phoneNumberVerified: true,
      role: true,
      banned: true,
      banReason: true,
      twoFactorEnabled: true,
      locale: true,
      createdAt: true,
      area: { select: { nameBn: true, nameEn: true } },
      accounts: { select: { providerId: true } },
      requests: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          code: true,
          status: true,
          title: true,
          createdAt: true,
          service: { select: { nameBn: true, nameEn: true } },
        },
      },
      listings: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { code: true, title: true, status: true, createdAt: true },
      },
    },
  });
}
