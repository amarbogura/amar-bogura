import type { AreaGroup } from "@/features/account/queries";
import type { MediaPurpose } from "@/generated/prisma/enums";

/** Data every field component may need, passed down from the page (server-loaded). */
export interface RenderContext {
  areaGroups: AreaGroup[];
  uploadPurpose: MediaPurpose;
}

/** areaId → name (already in the page language), for review/summary text. */
export function areaNameMap(groups: AreaGroup[]): Map<string, string> {
  const names = new Map<string, string>();
  for (const group of groups) {
    names.set(group.id, group.name);
    for (const area of group.areas)
      names.set(area.id, area.id === group.id ? group.name : area.name);
  }
  return names;
}

/** Stable DOM id for a form path ("details.route.to.address" → "f-details-route-to-address"). */
export const fieldId = (name: string) => `f-${name.replace(/[^\w-]/g, "-")}`;
