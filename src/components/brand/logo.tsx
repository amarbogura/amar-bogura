import Image from "next/image";

import { cn } from "@/lib/utils";

import logo from "../../../public/brand/logo-dark.png";

/**
 * The Amar Bogura logo on a white badge: its navy/teal/amber artwork is unreadable directly on the
 * green site header or the navy footer/admin bars. Size it with a height class (`h-8`, `h-10`…).
 * `alt` is empty by default because it usually sits inside a link that already has a label.
 */
export function Logo({
  alt = "",
  priority = false,
  className,
}: {
  alt?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center rounded-lg  px-0 py-1", className)}
    >
      <Image src={logo} alt={alt} priority={priority} sizes="160px" className="h-full w-auto" />
    </span>
  );
}
