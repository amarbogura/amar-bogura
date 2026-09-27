import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { TAGS } from "@/lib/cache-tags";
import { db } from "@/lib/db";

import { parseSiteSettings, type SiteSettings } from "./settings";

/** Cached for the static shell; admin setting changes call revalidateTag(TAGS.settings, "max"). */
export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.settings);
  const rows = await db.siteSetting.findMany({ select: { key: true, value: true } });
  return parseSiteSettings(rows);
}
