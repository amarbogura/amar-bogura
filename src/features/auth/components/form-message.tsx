import { Alert, AlertDescription } from "@/components/ui/alert";

/** Accessible inline error/notice for auth forms (announced by screen readers). */
export function FormMessage({
  message,
  tone = "error",
}: {
  message?: string | null;
  tone?: "error" | "info";
}) {
  if (!message) return null;
  return (
    <Alert
      variant={tone === "error" ? "destructive" : "default"}
      role={tone === "error" ? "alert" : "status"}
    >
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
