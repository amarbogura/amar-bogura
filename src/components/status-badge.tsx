import type { ListingStatus, RequestStatus } from "@/generated/prisma/enums";
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

export const REQUEST_STATUS: Record<RequestStatus, { label: string; tone: Tone }> = {
  NEW: { label: "নতুন", tone: "info" },
  REVIEWING: { label: "যাচাই চলছে", tone: "progress" },
  PROCESSING: { label: "কাজ চলছে", tone: "progress" },
  COMPLETED: { label: "সম্পন্ন", tone: "success" },
  REJECTED: { label: "বাতিল (অনুমোদিত নয়)", tone: "danger" },
  CANCELLED: { label: "বাতিল করা হয়েছে", tone: "muted" },
};

export const LISTING_STATUS: Record<ListingStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: "খসড়া", tone: "muted" },
  PENDING: { label: "অনুমোদনের অপেক্ষায়", tone: "progress" },
  ACTIVE: { label: "চালু", tone: "success" },
  REJECTED: { label: "অনুমোদিত হয়নি", tone: "danger" },
  CLOSED: { label: "বিক্রি / ভাড়া হয়ে গেছে", tone: "neutral" },
  EXPIRED: { label: "মেয়াদ শেষ", tone: "muted" },
  REMOVED: { label: "সরিয়ে দেওয়া হয়েছে", tone: "danger" },
};

export function StatusBadge(
  props: { kind: "request"; status: RequestStatus } | { kind: "listing"; status: ListingStatus },
) {
  const { label, tone } =
    props.kind === "request" ? REQUEST_STATUS[props.status] : LISTING_STATUS[props.status];
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
