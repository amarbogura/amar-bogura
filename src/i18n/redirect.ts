import "server-only";

import { permanentRedirect, redirect } from "next/navigation";

import { type Locale, localizePath } from "./config";

/** Server-side `redirect()` that keeps the language. */
export function redirectTo(locale: Locale, path: string): never {
  redirect(localizePath(locale, path));
}

export function permanentRedirectTo(locale: Locale, path: string): never {
  permanentRedirect(localizePath(locale, path));
}
