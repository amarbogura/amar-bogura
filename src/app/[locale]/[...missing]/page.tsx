import { notFound } from "next/navigation";

/**
 * Any unknown path (the proxy rewrites everything into `[locale]`) → the translated 404. Unknown
 * paths can't be prerendered, and a 404 may block, so this segment opts out of instant validation.
 */
export const instant = false;

export default function MissingPage() {
  notFound();
}
