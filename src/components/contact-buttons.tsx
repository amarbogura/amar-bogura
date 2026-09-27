import { MessageCircle, Phone } from "lucide-react";

import { telHref, whatsappHref } from "@/lib/contact-links";
import { cn } from "@/lib/utils";

const base =
  "tap inline-flex items-center justify-center gap-2 rounded-md px-5 font-semibold transition focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none";

/** Direct call link. Renders nothing while the number is not configured (null). */
export function CallButton({
  phone,
  label = "কল করুন",
  emergency = false,
  className,
}: {
  phone: string | null | undefined;
  label?: string;
  emergency?: boolean;
  className?: string;
}) {
  const href = telHref(phone);
  if (!href) return null;
  return (
    <a
      href={href}
      className={cn(
        base,
        emergency
          ? "bg-emergency text-emergency-foreground hover:bg-emergency/90"
          : "bg-primary text-primary-foreground hover:bg-primary/90",
        className,
      )}
    >
      <Phone className="size-5" aria-hidden="true" />
      {label}
    </a>
  );
}

/** WhatsApp chat link with optional prefilled message. Renders nothing without a number. */
export function WhatsAppButton({
  phone,
  text,
  label = "WhatsApp",
  className,
}: {
  phone: string | null | undefined;
  text?: string;
  label?: string;
  className?: string;
}) {
  const href = whatsappHref(phone, text);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        base,
        "border border-[#128C4B] text-[#0B6B37] hover:bg-[#128C4B]/10",
        className,
      )}
    >
      <MessageCircle className="size-5" aria-hidden="true" />
      {label}
    </a>
  );
}
