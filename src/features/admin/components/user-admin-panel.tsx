"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/features/auth/components/form-message";
import { banUser, setUserRole, unbanUser } from "@/features/users/admin-actions";
import { useT } from "@/i18n/client";
import type { ActionResult } from "@/lib/action";
import { ROLES, type Role } from "@/lib/permissions";

/** Ban / unban (users.manage) and role change (SUPER_ADMIN, `canChangeRole`). */
export function UserAdminPanel({
  userId,
  banned,
  role,
  canBan,
  canChangeRole,
}: {
  userId: string;
  banned: boolean;
  role: Role;
  canBan: boolean;
  canChangeRole: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [reason, setReason] = useState("");
  const [nextRole, setNextRole] = useState<Role>(role);

  const run = (action: () => Promise<ActionResult<unknown>>) =>
    start(async () => {
      const result = await action();
      if (!result.ok) return setMessage({ tone: "error", text: result.error });
      setMessage({ tone: "info", text: t("admin.request.saved") });
      router.refresh();
    });

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <FormMessage message={message?.text} tone={message?.tone} />
      {canBan &&
        (banned ? (
          <Button
            type="button"
            variant="outline"
            className="self-start"
            disabled={pending}
            onClick={() => run(() => unbanUser({ userId }))}
          >
            {t("admin.users.unban")}
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <Label htmlFor="ban-reason">{t("admin.users.banReason")}</Label>
            <Input
              id="ban-reason"
              value={reason}
              maxLength={200}
              onChange={(event) => setReason(event.target.value)}
              className="h-11"
            />
            <Button
              type="button"
              variant="destructive"
              className="self-start"
              disabled={pending || reason.trim().length < 3}
              onClick={() => run(() => banUser({ userId, reason }))}
            >
              {t("admin.users.ban")}
            </Button>
          </div>
        ))}
      {canChangeRole && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="user-role">{t("admin.users.changeRole")}</Label>
          <select
            id="user-role"
            value={nextRole}
            onChange={(event) => setNextRole(event.target.value as Role)}
            className="h-11 rounded-md border border-input bg-background px-3 text-sm"
          >
            {ROLES.map((value) => (
              <option key={value} value={value}>
                {t(`roles.${value}`)}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            className="self-start"
            disabled={pending || nextRole === role}
            onClick={() => run(() => setUserRole({ userId, role: nextRole }))}
          >
            {t("admin.users.saveRole")}
          </Button>
        </div>
      )}
    </section>
  );
}
