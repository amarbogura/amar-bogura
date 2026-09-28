"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps, forwardRef, useMemo } from "react";

import { useLocale } from "./client";
import { localizePath } from "./config";

type LinkProps = ComponentProps<typeof NextLink>;

/**
 * Drop-in `next/link` that keeps the current language: `/services/x` → `/en/services/x` on English
 * pages. Use it for every internal link (external/`tel:` hrefs pass through unchanged).
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, ...props },
  ref,
) {
  const locale = useLocale();
  const localized = typeof href === "string" ? localizePath(locale, href) : href;
  return <NextLink ref={ref} href={localized} {...props} />;
});

/** `router.push/replace` with locale-prefixed paths. */
export function useLocaleRouter() {
  const router = useRouter();
  const locale = useLocale();
  return useMemo(
    () => ({
      ...router,
      push: (href: string, options?: Parameters<typeof router.push>[1]) =>
        router.push(localizePath(locale, href), options),
      replace: (href: string, options?: Parameters<typeof router.replace>[1]) =>
        router.replace(localizePath(locale, href), options),
    }),
    [router, locale],
  );
}
