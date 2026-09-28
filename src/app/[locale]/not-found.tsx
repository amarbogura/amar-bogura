"use client";

import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useT();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">{t("notFound.title")}</h1>
      <p className="text-muted-foreground">{t("notFound.text")}</p>
      <Button asChild>
        <Link href="/">{t("common.backHome")}</Link>
      </Button>
    </main>
  );
}
