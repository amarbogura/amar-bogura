import Link from "next/link";

import { Icon } from "@/components/icon";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import type { QuickAction } from "../sections";

const ACTIONS: Record<
  QuickAction,
  { href: string; icon: string; title: string; text: string; emergency?: boolean }
> = {
  "custom-request": {
    href: routes.customRequest,
    icon: "message-square-plus",
    title: "কাস্টম রিকোয়েস্ট",
    text: "তালিকায় নেই? যা দরকার লিখে জানান",
  },
  ambulance: {
    href: routes.ambulance,
    icon: "siren",
    title: "জরুরি অ্যাম্বুলেন্স",
    text: "এখনই কল বা রিকোয়েস্ট করুন",
    emergency: true,
  },
  "buy-sell": {
    href: routes.buySell,
    icon: "shopping-bag",
    title: "বাই অ্যান্ড সেল",
    text: "পুরাতন-নতুন জিনিস কেনাবেচা",
  },
};

export function QuickActions({ titleBn, actions }: { titleBn: string; actions: QuickAction[] }) {
  return (
    <section aria-label={titleBn}>
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
                  <span className="font-semibold">{action.title}</span>
                  <span
                    className={cn(
                      "text-sm",
                      action.emergency ? "text-white/90" : "text-muted-foreground",
                    )}
                  >
                    {action.text}
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
