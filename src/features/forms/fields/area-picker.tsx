"use client";

import { useId, useState } from "react";

import type { AreaGroup } from "@/features/account/queries";
import { useT } from "@/i18n/client";

import { selectClass } from "./choice-fields";

export const OUTSIDE_BOGURA = "__outside__";

function groupOf(groups: AreaGroup[], areaId: string | null | undefined) {
  return areaId
    ? groups.find((group) => group.areas.some((area) => area.id === areaId))
    : undefined;
}

/**
 * Upazila → area (docs/03 §4 "address/area picker"). Upazilas without sub-areas are selected
 * directly. `allowOutside` adds "Outside Bogura" (value null) for route destinations.
 */
export function AreaPicker({
  id,
  groups,
  value,
  onChange,
  allowOutside = false,
  invalid,
  describedBy,
  ariaLabel,
}: {
  id: string;
  groups: AreaGroup[];
  value: string | null | undefined;
  onChange: (areaId: string | null) => void;
  allowOutside?: boolean;
  invalid?: boolean;
  describedBy?: string;
  /** Only when no visible <label htmlFor={id}> exists. */
  ariaLabel?: string;
}) {
  const t = useT();
  const areaSelectId = useId();
  const [outside, setOutside] = useState(allowOutside && value === null);
  const selected = groupOf(groups, value);
  const upazilaValue = outside ? OUTSIDE_BOGURA : (selected?.id ?? "");
  const hasSubAreas = !!selected && selected.areas.length > 1;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <select
        id={id}
        className={selectClass}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        value={upazilaValue}
        onChange={(event) => {
          const next = event.target.value;
          setOutside(next === OUTSIDE_BOGURA);
          if (next === OUTSIDE_BOGURA) return onChange(null);
          // The upazila itself is a valid area; a sub-area can be chosen next.
          onChange(next || null);
        }}
      >
        <option value="">{t("forms.chooseUpazila")}</option>
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
        {allowOutside && <option value={OUTSIDE_BOGURA}>{t("forms.outsideBogura")}</option>}
      </select>
      {hasSubAreas && (
        <select
          id={areaSelectId}
          className={selectClass}
          aria-label={t("forms.area")}
          aria-invalid={invalid || undefined}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value || selected.id)}
        >
          {selected.areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
