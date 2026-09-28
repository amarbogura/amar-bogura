"use client";

import { Icon } from "@/components/icon";
import { useT } from "@/i18n/client";
import type { Messages } from "@/i18n/messages";
import { Link } from "@/i18n/navigation";
import type { MessageKey } from "@/i18n/translate";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import type { QuickAction } from "../sections";

const ACTIONS: Record<
  QuickAction,
  {
    href: string;
    icon: string;
    title: MessageKey<Messages>;
    text: MessageKey<Messages>;
    emergency?: boolean;
  }
> = {
  "custom-request": {
    href: routes.customRequest,
    icon: "message-square-plus",
    title: "home.quick.customTitle",
    text: "home.quick.customText",
  },
  ambulance: {
    href: routes.ambulance,
    icon: "siren",
    title: "home.quick.ambulanceTitle",
    text: "home.quick.ambulanceText",
    emergency: true,
  },
  "buy-sell": {
    href: routes.buySell,
    icon: "shopping-bag",
    title: "home.quick.buySellTitle",
    text: "home.quick.buySellText",
  },
};

export function QuickActions({ title, actions }: { title: string; actions: QuickAction[] }) {
  const t = useT();
  return (
    <section aria-label={title}>
      <ul className="grid gap-3 sm:grid-cols-3">
        {actions.map((key) => {
          const action = ACTIONS[key];
          return (
            <li key={key}>
              <Link
                href={action.href}
                className={cn(
                  "flex h-full items-center gap-3 rounded-2xl p-4 shadow-xs transition hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                  action.emergency
                    ? "bg-emergency text-emergency-foreground"
                    : "border bg-card text-foreground hover:border-primary/40",
                )}
              >
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl",
                    action.emergency ? "bg-white/15" : "bg-primary-tint text-primary",
                  )}
                >
                  <Icon name={action.icon} />
                </span>
                <span className="flex flex-col">
                  <span className="font-semibold">{t(action.title)}</span>
                  <span
                    className={cn(
                      "text-sm",
                      action.emergency ? "text-white/90" : "text-muted-foreground",
                    )}
                  >
                    {t(action.text)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
