"use client";

import { Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";

import { exportRequestsCsv } from "../requests/admin-actions";
import type { RequestFilters } from "../requests/filters";

/** Builds the CSV on the server (same filters as the list) and downloads it in the browser. */
export function ExportCsvButton({ filters }: { filters: RequestFilters }) {
  const t = useT();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          const result = await exportRequestsCsv({ ...filters, page: undefined });
          setPending(false);
          if (!result.ok) return setError(result.error);
          const url = URL.createObjectURL(
            new Blob([result.data.csv], { type: "text/csv;charset=utf-8" }),
          );
          const link = document.createElement("a");
          link.href = url;
          link.download = result.data.filename;
          link.click();
          URL.revokeObjectURL(url);
        }}
      >
        <Download aria-hidden="true" />
        {pending ? t("admin.requests.exporting") : t("admin.requests.export")}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
