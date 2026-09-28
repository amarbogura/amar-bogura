"use client";

import type { ListingStatus, RequestStatus } from "@/generated/prisma/enums";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "info" | "progress" | "success" | "danger" | "muted";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-muted text-foreground",
  info: "bg-navy/10 text-navy",
  progress: "bg-cta-tint text-cta",
  success: "bg-primary-tint text-primary",
  danger: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

/** Tone per status; the label is t("status.request.<STATUS>"). */
export const REQUEST_STATUS_TONE: Record<RequestStatus, Tone> = {
  NEW: "info",
  REVIEWING: "progress",
  PROCESSING: "progress",
  COMPLETED: "success",
  REJECTED: "danger",
  CANCELLED: "muted",
};

export const LISTING_STATUS_TONE: Record<ListingStatus, Tone> = {
  DRAFT: "muted",
  PENDING: "progress",
  ACTIVE: "success",
  REJECTED: "danger",
  CLOSED: "neutral",
  EXPIRED: "muted",
  REMOVED: "danger",
};

export function StatusBadge(
  props: { kind: "request"; status: RequestStatus } | { kind: "listing"; status: ListingStatus },
) {
  const t = useT();
  const [label, tone] =
    props.kind === "request"
      ? [t(`status.request.${props.status}`), REQUEST_STATUS_TONE[props.status]]
      : [t(`status.listing.${props.status}`), LISTING_STATUS_TONE[props.status]];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
      )}
    >
      {label}
    </span>
  );
}
