"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/features/account/actions";
import type { AreaGroup } from "@/features/account/queries";
import { FormMessage } from "@/features/auth/components/form-message";
import { useT } from "@/i18n/client";

export function ProfileForm({
  name,
  areaId,
  areaGroups,
}: {
  name: string;
  areaId: string | null;
  areaGroups: AreaGroup[];
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await updateProfile({
            name: String(form.get("name") ?? ""),
            areaId: String(form.get("areaId") ?? ""),
          });
          setMessage(
            result.ok
              ? { tone: "info", text: t("account.profileSaved") }
              : { tone: "error", text: result.error },
          );
        });
      }}
    >
      <FormMessage message={message?.text} tone={message?.tone} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t("account.name")}</Label>
        <Input
          id="name"
          name="name"
          defaultValue={name}
          autoComplete="name"
          minLength={2}
          maxLength={60}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="areaId">{t("account.area")}</Label>
        <select
          id="areaId"
          name="areaId"
          defaultValue={areaId ?? ""}
          className="h-11 rounded-md border border-input bg-background px-3 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="">{t("account.chooseArea")}</option>
          {areaGroups.map((group) => (
            <optgroup key={group.id} label={group.name}>
              {group.areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t("common.saving") : t("common.save")}
      </Button>
    </form>
  );
}
