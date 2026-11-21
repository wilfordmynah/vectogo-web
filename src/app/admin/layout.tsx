import { notFound } from "next/navigation";
import { currentUser, isAdminEmail } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Only people on the ADMIN_EMAILS list get in. Everyone else sees a 404.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!isAdminEmail(user?.email)) notFound();
  return children;
}
