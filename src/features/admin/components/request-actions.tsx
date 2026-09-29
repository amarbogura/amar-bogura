"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "@/features/auth/components/form-message";
import type { RequestStatus } from "@/generated/prisma/enums";
import { useT } from "@/i18n/client";
import { toLatinDigits } from "@/i18n/format";
import type { ActionResult } from "@/lib/action";

import {
  addNote,
  assignRequest,
  blockPhone,
  changeStatus,
  markSpam,
  setQuote,
  setTags,
  unblockPhone,
} from "../requests/admin-actions";

const selectClass =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function useRun() {
  const router = useRouter();
  const t = useT();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const run = (action: () => Promise<ActionResult<unknown>>, onOk?: () => void) =>
    start(async () => {
      const result = await action();
      if (!result.ok) return setMessage({ tone: "error", text: result.error });
      setMessage({ tone: "info", text: t("admin.request.saved") });
      onOk?.();
      router.refresh();
    });
  return { pending, message, run };
}

/** Status, messages/notes, assignment, quote, tags, spam — every call is an audited admin action. */
export function RequestActions({
  code,
  allowedNext,
  needsMessage,
  assigneeId,
  admins,
  meId,
  quotedAmount,
  tags,
  isSpam,
}: {
  code: string;
  allowedNext: RequestStatus[];
  needsMessage: RequestStatus[];
  assigneeId: string | null;
  admins: Array<{ id: string; name: string }>;
  meId: string;
  quotedAmount: number | null;
  tags: string[];
  isSpam: boolean;
}) {
  const t = useT();
  const { pending, message, run } = useRun();
  const [text, setText] = useState("");
  const [visible, setVisible] = useState(true);
  const [assignee, setAssignee] = useState(assigneeId ?? "");
  const [quote, setQuoteText] = useState(quotedAmount?.toString() ?? "");
  const [tagText, setTagText] = useState(tags.join(", "));

  return (
    <section
      aria-labelledby="actions-title"
      className="flex flex-col gap-4 rounded-xl border bg-card p-4"
    >
      <h2 id="actions-title" className="font-semibold">
        {t("admin.request.actions")}
      </h2>
      <FormMessage message={message?.text} tone={message?.tone} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="admin-message">{t("admin.request.message")}</Label>
        <Textarea
          id="admin-message"
          value={text}
          maxLength={1000}
          placeholder={t("admin.request.messagePlaceholder")}
          onChange={(event) => setText(event.target.value)}
        />
        <fieldset className="flex flex-wrap gap-4 text-sm">
          <legend className="sr-only">{t("admin.request.message")}</legend>
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="radio"
              name="visibility"
              checked={visible}
              onChange={() => setVisible(true)}
              className="size-4"
            />
            {t("admin.request.visibleToCustomer")}
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="radio"
              name="visibility"
              checked={!visible}
              onChange={() => setVisible(false)}
              className="size-4"
            />
            {t("admin.request.internalNote")}
          </label>
        </fieldset>
        <Button
          type="button"
          variant="outline"
          disabled={pending || !text.trim()}
          onClick={() =>
            run(
              () => addNote({ code, message: text, visibleToUser: visible }),
              () => setText(""),
            )
          }
          className="self-start"
        >
          {t("admin.request.addNote")}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t("admin.request.changeStatus")}</h3>
        {allowedNext.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("admin.request.closed")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allowedNext.map((status) => (
              <Button
                key={status}
                type="button"
                variant={
                  status === "REJECTED" || status === "CANCELLED" ? "destructive" : "default"
                }
                disabled={pending || (needsMessage.includes(status) && !text.trim())}
                title={
                  needsMessage.includes(status) ? t("admin.errors.messageRequired") : undefined
                }
                onClick={() =>
                  run(
                    () => changeStatus({ code, to: status, message: text.trim() || undefined }),
                    () => setText(""),
                  )
                }
              >
                {t("admin.request.moveTo", { status: t(`status.request.${status}`) })}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* One column inside the 24rem side panel on large screens. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div className="flex flex-col gap-2">
          <Label htmlFor="admin-assignee">{t("admin.request.assign")}</Label>
          <select
            id="admin-assignee"
            className={selectClass}
            value={assignee}
            onChange={(event) => setAssignee(event.target.value)}
          >
            <option value="">{t("admin.request.unassign")}</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.name}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => run(() => assignRequest({ code, userId: assignee || null }))}
            >
              {t("admin.request.save")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={pending || assigneeId === meId}
              onClick={() => {
                setAssignee(meId);
                run(() => assignRequest({ code, userId: meId }));
              }}
            >
              {t("admin.request.assignMe")}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="admin-quote">{t("admin.request.quote")}</Label>
          <Input
            id="admin-quote"
            inputMode="numeric"
            value={quote}
            onChange={(event) => setQuoteText(event.target.value)}
            className="h-11"
          />
          <Button
            type="button"
            variant="outline"
            className="self-start"
            disabled={pending || !/^\d+$/.test(toLatinDigits(quote).replace(/[,\s]/g, ""))}
            onClick={() =>
              run(() =>
                setQuote({ code, amount: Number(toLatinDigits(quote).replace(/[,\s]/g, "")) }),
              )
            }
          >
            {t("admin.request.quoteSave")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="admin-tags">{t("admin.request.tags")}</Label>
        <Input
          id="admin-tags"
          value={tagText}
          placeholder={t("admin.request.tagsPlaceholder")}
          onChange={(event) => setTagText(event.target.value)}
          className="h-11"
        />
        <Button
          type="button"
          variant="outline"
          className="self-start"
          disabled={pending}
          onClick={() =>
            run(() =>
              setTags({
                code,
                tags: tagText
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              }),
            )
          }
        >
          {t("admin.request.save")}
        </Button>
      </div>

      <Button
        type="button"
        variant="ghost"
        className="self-start text-destructive"
        disabled={pending}
        onClick={() => run(() => markSpam({ code, spam: !isSpam }))}
      >
        {isSpam ? t("admin.request.unmarkSpam") : t("admin.request.markSpam")}
      </Button>
    </section>
  );
}

/** Block / unblock the contact phone (D-03 blocklist: blocked numbers can't submit online). */
export function BlockPhoneButton({ phone, blocked }: { phone: string; blocked: boolean }) {
  const t = useT();
  const { pending, message, run } = useRun();
  const [reason, setReason] = useState("");
  if (blocked) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-destructive">{t("admin.request.phoneBlocked")}</p>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => unblockPhone({ phone }))}
          className="self-start"
        >
          {t("admin.request.unblockPhone")}
        </Button>
        <FormMessage message={message?.text} tone={message?.tone} />
      </div>
    );
  }
  return (
    <details className="text-sm">
      <summary className="inline-flex min-h-11 cursor-pointer items-center text-destructive underline">
        {t("admin.request.blockPhone")}
      </summary>
      <div className="mt-2 flex flex-col gap-2">
        <Label htmlFor="block-reason">{t("admin.request.blockReason")}</Label>
        <Input
          id="block-reason"
          value={reason}
          maxLength={200}
          onChange={(event) => setReason(event.target.value)}
          className="h-11"
        />
        <Button
          type="button"
          variant="destructive"
          className="self-start"
          disabled={pending}
          onClick={() => run(() => blockPhone({ phone, reason: reason || undefined }))}
        >
          {t("admin.request.blockPhone")}
        </Button>
        <FormMessage message={message?.text} tone={message?.tone} />
      </div>
    </details>
  );
}
