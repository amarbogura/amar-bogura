import "server-only";

import { db } from "@/lib/db";

export interface AreaGroup {
  id: string;
  nameBn: string;
  areas: Array<{ id: string; nameBn: string }>;
}

/** Upazilas with their areas, for grouped area pickers. An upazila without areas is selectable itself. */
export async function getAreaGroups(): Promise<AreaGroup[]> {
  const upazilas = await db.area.findMany({
    where: { type: "UPAZILA", isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      nameBn: true,
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, nameBn: true },
      },
    },
  });
  return upazilas.map((upazila) => ({
    id: upazila.id,
    nameBn: upazila.nameBn,
    areas: [{ id: upazila.id, nameBn: `${upazila.nameBn} (সম্পূর্ণ)` }, ...upazila.children],
  }));
}

export async function getLinkedProviders(userId: string): Promise<string[]> {
  const accounts = await db.account.findMany({ where: { userId }, select: { providerId: true } });
  return accounts.map((account) => account.providerId);
}

export async function getUserAreaId(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { areaId: true } });
  return user?.areaId ?? null;
}
