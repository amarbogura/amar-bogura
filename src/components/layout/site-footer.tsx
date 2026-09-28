"use client";

import { CallButton } from "@/components/contact-buttons";
import { useLocale, useT } from "@/i18n/client";
import type { Messages } from "@/i18n/messages";
import { Link } from "@/i18n/navigation";
import type { MessageKey } from "@/i18n/translate";
import { formatBdPhoneDisplay } from "@/lib/phone";
import { routes } from "@/lib/routes";

import { LanguageSwitcher } from "./language-switcher";

const LINKS: Array<{ href: string; label: MessageKey<Messages> }> = [
  { href: routes.page("about"), label: "footer.about" },
  { href: routes.page("contact"), label: "footer.contact" },
  { href: routes.page("help"), label: "footer.help" },
  { href: routes.page("terms"), label: "footer.terms" },
  { href: routes.page("privacy"), label: "footer.privacy" },
  { href: routes.page("report"), label: "footer.report" },
];

export function SiteFooter({ hotline }: { hotline: string | null }) {
  const t = useT();
  const locale = useLocale();
  return (
    <footer className="mt-12 bg-navy text-navy-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:items-start md:justify-between">
        <div className="flex max-w-sm flex-col gap-2">
          <p className="text-lg font-bold">{t("common.siteName")}</p>
          <p className="text-sm text-white/80">{t("footer.blurb")}</p>
          {hotline && (
            <div className="flex flex-col gap-2 pt-2">
              <p className="text-sm text-white/80">
                {t("common.hotlineLabel", { phone: formatBdPhoneDisplay(hotline, locale) })}
              </p>
              <CallButton phone={hotline} label={t("common.callHotline")} className="self-start" />
            </div>
          )}
        </div>
        <nav aria-label={t("nav.footer")}>
          <ul className="grid grid-cols-2 gap-x-8 gap-y-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex tap items-center text-sm text-white/90 hover:underline"
                >
                  {t(link.label)}
                </Link>
              </li>
            ))}
            <li>
              <LanguageSwitcher variant="footer" className="text-white/90" />
            </li>
          </ul>
        </nav>
      </div>
      <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/70">
        {t("footer.copyright")}
      </p>
    </footer>
  );
}
