import { FormMessage } from "@/features/auth/components/form-message";
import { requireAdminPage } from "@/lib/session";

// Placeholder dashboard — P8 builds the overview, requests, users and audit screens.
export default async function AdminHomePage({ searchParams }: PageProps<"/admin">) {
  const { user } = await requireAdminPage();
  const { denied } = await searchParams;
  return (
    <>
      {denied && <FormMessage message="ওই পেজ দেখার অনুমতি আপনার নেই।" />}
      <h1 className="text-2xl font-bold">স্বাগতম, {user.name}</h1>
      <p className="text-muted-foreground">অ্যাডমিন প্যানেলের কাজগুলো পরের ধাপে যোগ হবে।</p>
    </>
  );
}
