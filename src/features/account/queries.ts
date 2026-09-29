import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { Locale } from "@/i18n/config";
import { pick } from "@/i18n/content";
import { getT } from "@/i18n/server";
import { TAGS } from "@/lib/cache-tags";
import { db } from "@/lib/db";

/** Names are resolved for one language. */
export interface AreaGroup {
  id: string;
  name: string;
  areas: Array<{ id: string; name: string }>;
}

/**
 * Upazilas with their areas, for grouped area pickers. An upazila without areas is selectable itself.
 * Cached (also keeps the DB call out of prerendering); area edits call revalidateTag(TAGS.areas).
 */
export async function getAreaGroups(locale: Locale): Promise<AreaGroup[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.areas);
  const t = getT(locale);
  const upazilas = await db.area.findMany({
    where: { type: "UPAZILA", isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      nameBn: true,
      nameEn: true,
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, nameBn: true, nameEn: true },
      },
    },
  });
  return upazilas.map((upazila) => ({
    id: upazila.id,
    name: pick(upazila, "name", locale),
    // The upazila itself is selectable: "somewhere else / not sure" when it has sub-areas.
    areas: [
      {
        id: upazila.id,
        name: upazila.children.length
          ? t("account.otherArea", { upazila: pick(upazila, "name", locale) })
          : pick(upazila, "name", locale),
      },
      ...upazila.children.map((area) => ({ id: area.id, name: pick(area, "name", locale) })),
    ],
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
